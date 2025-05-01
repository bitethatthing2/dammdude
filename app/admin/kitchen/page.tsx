import { KitchenDisplay } from "@/components/bartap/admin/KitchenDisplay";

export const metadata = {
  title: "Kitchen Display - BarTap Admin",
  description: "Kitchen display system for order management",
};

export default function KitchenPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kitchen Display</h1>
        <p className="text-muted-foreground">
          Manage orders in real-time for kitchen preparation
        </p>
      </div>
      
      <KitchenDisplay />
    </div>
  );
}
