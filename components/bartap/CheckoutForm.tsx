"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBarTap } from '@/lib/contexts/bartap-context';
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';
import { formatCurrency } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MapPin, CreditCard, Check, AlertCircle } from 'lucide-react';

type BartenderOrder = Database['public']['Tables']['bartender_orders']['Insert'];
type Location = Database['public']['Tables']['locations']['Row'];
type WolfpackTab = Database['public']['Tables']['wolfpack_bar_tabs']['Row'];

interface TableData {
  id: string;
  name: string;
  section?: string;
}

interface CheckoutFormProps {
  tableData: TableData;
}

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface OrderDetails {
  orderType: 'pickup' | 'table_delivery';
  tableLocation?: string;
  customerNotes?: string;
}

interface PaymentInfo {
  method: 'pay_at_bar' | 'wolfpack_tab' | 'cash';
  tabId?: string;
}

export function CheckoutForm({ tableData }: CheckoutFormProps) {
  const router = useRouter();
  const { cartItems, totalPrice, clearCart } = useBarTap();
  const { wolfpack, canAccessBarTab } = useWolfpackAccess();
  const supabase = getSupabaseBrowserClient();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Form data
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    orderType: 'table_delivery',
    tableLocation: tableData.name,
    customerNotes: ''
  });
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'pay_at_bar'
  });

  // Additional state
  const [location, setLocation] = useState<Location | null>(null);
  const [wolfpackTab, setWolfpackTab] = useState<WolfpackTab | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  // Calculate totals
  const subtotal = totalPrice;
  const tax = subtotal * 0.0825; // 8.25% tax
  const total = subtotal + tax;

  // Fetch location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .single();
      
      if (data && !error) {
        setLocation(data);
      }
    };
    
    fetchLocation();
  }, [supabase]);

  // Fetch user data if authenticated
  useEffect(() => {
    const fetchUserData = async () => {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || wolfpack === "loading") return;
      
      setUserId(user.id);
      
      const { data: userData } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('auth_id', user.id)
        .single();
      
      if (userData) {
        setCustomerInfo({
          email: userData.email,
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          phone: ''
        });
      }
      
      // Check for existing Wolfpack tab if member
      if (wolfpack === "active" && location) {
        const { data: tabData } = await supabase
          .from('wolfpack_bar_tabs')
          .select('*')
          .eq('user_id', userData?.id)
          .eq('location_id', location.id)
          .eq('status', 'open')
          .single();
        
        if (tabData) {
          setWolfpackTab(tabData);
          setPaymentInfo({ method: 'wolfpack_tab', tabId: tabData.id });
        }
      }
    };
    
    fetchUserData();
  }, [wolfpack, location, supabase]);

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return cartItems.length > 0;
      case 2:
        return !!(
          customerInfo.email &&
          customerInfo.firstName &&
          customerInfo.lastName &&
          validateEmail(customerInfo.email)
        );
      case 3:
        return !!(
          orderDetails.orderType &&
          (orderDetails.orderType === 'pickup' || orderDetails.tableLocation)
        );
      case 4:
        return !!(
          paymentInfo.method &&
          (paymentInfo.method !== 'wolfpack_tab' || paymentInfo.tabId)
        );
      default:
        return true;
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  // Handle step navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      setError(null);
    } else {
      setError('Please complete all required fields');
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!location) {
      setError('Location not found');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Transform cart items to match database schema
      const orderItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
        customizations: item.customizations || {}
      }));

      // Create the order
      const orderData: BartenderOrder = {
        customer_id: userId || null,
        location_id: location.id,
        status: 'pending',
        order_type: orderDetails.orderType,
        table_location: orderDetails.orderType === 'table_delivery' ? orderDetails.tableLocation : null,
        items: orderItems,
        total_amount: total,
        customer_notes: orderDetails.customerNotes || null,
        tab_id: paymentInfo.method === 'wolfpack_tab' ? paymentInfo.tabId : null
      };

      const { data: order, error: orderError } = await supabase
        .from('bartender_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError || !order) {
        console.error('Order creation error:', orderError);
        throw new Error('Failed to create order');
      }

      // Update Wolfpack tab if used
      if (paymentInfo.method === 'wolfpack_tab' && paymentInfo.tabId && wolfpackTab) {
        const newTabTotal = (wolfpackTab.total_amount || 0) + total;
        
        await supabase
          .from('wolfpack_bar_tabs')
          .update({ 
            total_amount: newTabTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentInfo.tabId);
      }

      // Store order number for confirmation
      setOrderNumber(order.order_number);
      
      // Clear cart and advance to confirmation
      clearCart();
      setCurrentStep(5);
      
    } catch (err) {
      console.error('Order submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Review Your Order</h2>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    {item.notes && (
                      <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                    )}
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    id="firstName"
                    type="text"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    id="lastName"
                    type="text"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone (optional)</label>
                <input
                  id="phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Order Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order Type *</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="table_delivery"
                      checked={orderDetails.orderType === 'table_delivery'}
                      onChange={(e) => setOrderDetails({ ...orderDetails, orderType: e.target.value as 'table_delivery' })}
                      className="mr-3"
                      aria-label="Table Delivery"
                    />
                    <div>
                      <p className="font-medium">Table Delivery</p>
                      <p className="text-sm text-gray-600">We&apos;ll bring it to your table</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="pickup"
                      checked={orderDetails.orderType === 'pickup'}
                      onChange={(e) => setOrderDetails({ ...orderDetails, orderType: e.target.value as 'pickup' })}
                      className="mr-3"
                      aria-label="Pickup at Bar"
                    />
                    <div>
                      <p className="font-medium">Pickup at Bar</p>
                      <p className="text-sm text-gray-600">Pick up your order at the bar</p>
                    </div>
                  </label>
                </div>
              </div>
              
              {orderDetails.orderType === 'table_delivery' && (
                <div>
                  <label htmlFor="tableLocation" className="block text-sm font-medium mb-1">Table Location *</label>
                  <input
                    id="tableLocation"
                    type="text"
                    value={orderDetails.tableLocation}
                    onChange={(e) => setOrderDetails({ ...orderDetails, tableLocation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Table number or location"
                    required
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="customerNotes" className="block text-sm font-medium mb-1">Special Instructions (optional)</label>
                <textarea
                  id="customerNotes"
                  value={orderDetails.customerNotes}
                  onChange={(e) => setOrderDetails({ ...orderDetails, customerNotes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Any special requests or dietary restrictions?"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Payment Method</h2>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="pay_at_bar"
                  checked={paymentInfo.method === 'pay_at_bar'}
                  onChange={(e) => setPaymentInfo({ method: e.target.value as 'pay_at_bar' })}
                  className="mr-3"
                  aria-label="Pay at Bar"
                />
                <div className="flex-1">
                  <p className="font-medium">Pay at Bar</p>
                  <p className="text-sm text-gray-600">Pay when you pick up or receive your order</p>
                </div>
                <CreditCard className="w-5 h-5 text-gray-400" />
              </label>
              
              {wolfpack !== "loading" && wolfpack === "active" && wolfpackTab && (
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 border-primary">
                  <input
                    type="radio"
                    value="wolfpack_tab"
                    checked={paymentInfo.method === 'wolfpack_tab'}
                    onChange={(e) => setPaymentInfo({ method: e.target.value as 'wolfpack_tab', tabId: wolfpackTab.id })}
                    className="mr-3"
                    aria-label="Wolfpack Tab"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-primary">Wolfpack Tab</p>
                    <p className="text-sm text-gray-600">
                      Add to your tab • Current: {formatCurrency(wolfpackTab.total_amount || 0)}
                    </p>
                  </div>
                  <div className="bg-primary text-white text-xs px-2 py-1 rounded">MEMBER</div>
                </label>
              )}
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="cash"
                  checked={paymentInfo.method === 'cash'}
                  onChange={(e) => setPaymentInfo({ method: e.target.value as 'cash' })}
                  className="mr-3"
                  aria-label="Cash"
                />
                <div className="flex-1">
                  <p className="font-medium">Cash</p>
                  <p className="text-sm text-gray-600">Pay with cash at the bar</p>
                </div>
              </label>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Total Due:</strong> {formatCurrency(total)}
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Order Confirmed!</h2>
              <p className="text-gray-600">Your order has been received</p>
            </div>
            {orderNumber && (
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="text-2xl font-bold">#{orderNumber.toString().padStart(4, '0')}</p>
              </div>
            )}
            <div className="space-y-2 text-left max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Type:</span>
                <span className="font-medium">
                  {orderDetails.orderType === 'table_delivery' ? 'Table Delivery' : 'Pickup at Bar'}
                </span>
              </div>
              {orderDetails.orderType === 'table_delivery' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-medium">{orderDetails.tableLocation}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className="font-medium">
                  {paymentInfo.method === 'wolfpack_tab' ? 'Wolfpack Tab' :
                   paymentInfo.method === 'cash' ? 'Cash' : 'Pay at Bar'}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push('/menu')}
              className="btn btn-primary w-full max-w-sm"
            >
              Back to Menu
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (cartItems.length === 0 && currentStep < 5) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Your cart is empty</p>
        <button
          onClick={() => router.push('/menu')}
          className="btn btn-primary"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      {currentStep < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Review', 'Info', 'Details', 'Payment'].map((step, index) => (
              <div
                key={step}
                className={`flex items-center ${index < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep > index + 1
                      ? 'bg-green-600 text-white'
                      : currentStep === index + 1
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > index + 1 ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Review</span>
            <span>Info</span>
            <span>Details</span>
            <span>Payment</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handlePrev}
              className="btn btn-outline flex items-center gap-2"
              disabled={isSubmitting}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitOrder}
              className="btn btn-primary flex-1"
              disabled={isSubmitting || !validateStep(4)}
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
