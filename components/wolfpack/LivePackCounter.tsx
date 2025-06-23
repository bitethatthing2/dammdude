import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface PackCounts {
  salem: number;
  portland: number;
}

function animateCountChange(newCounts: PackCounts, setAnimatedCounts: React.Dispatch<React.SetStateAction<PackCounts>>) {
  // Simple animation by directly setting the new values
  // In a more complex implementation, you could animate the numbers incrementally
  setAnimatedCounts(newCounts);
}

export function LivePackCounter() {
  const [animatedCounts, setAnimatedCounts] = useState<PackCounts>({ salem: 0, portland: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function fetchPackCounts() {
      try {
        setIsLoading(true);

        // Get Salem location members
        const { data: salemData } = await supabase
          .from('wolf_pack_members')
          .select('id')
          .eq('is_active', true)
          .ilike('table_location', '%salem%');

        // Get Portland location members  
        const { data: portlandData } = await supabase
          .from('wolf_pack_members')
          .select('id')
          .eq('is_active', true)
          .ilike('table_location', '%portland%');

        const newCounts = { 
          salem: salemData?.length || 0, 
          portland: portlandData?.length || 0 
        };

        // Animate number changes
        animateCountChange(newCounts, setAnimatedCounts);
      } catch (error) {
        console.error('Error fetching pack counts:', error);
        // Fallback numbers for demo
        animateCountChange({ salem: 12, portland: 8 }, setAnimatedCounts);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPackCounts();

    // Set up real-time subscription
    const subscription = supabase
      .channel('pack_counter_live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolf_pack_members'
        },
        () => {
          fetchPackCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="pack-counter-container">
        <div className="grid grid-cols-3 gap-4 items-center p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg border">
          <div className="text-center">
            <div className="animate-pulse bg-gray-600 h-6 w-20 mx-auto mb-2 rounded"></div>
            <div className="animate-pulse bg-gray-600 h-10 w-12 mx-auto rounded"></div>
          </div>
          <div className="text-center">
            <div className="animate-pulse bg-gray-600 h-8 w-8 mx-auto rounded"></div>
          </div>
          <div className="text-center">
            <div className="animate-pulse bg-gray-600 h-6 w-20 mx-auto mb-2 rounded"></div>
            <div className="animate-pulse bg-gray-600 h-10 w-12 mx-auto rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pack-counter-container">
      <div className="grid grid-cols-3 gap-4 items-center p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg border">
        {/* Salem Pack */}
        <div className="pack-location salem text-center">
          <h3 className="text-lg font-bold text-blue-400 mb-2">Salem Pack</h3>
          <motion.div 
            className="count text-4xl font-extrabold"
            key={animatedCounts.salem}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {animatedCounts.salem}
          </motion.div>
          <p className="text-sm text-muted-foreground mt-1">wolves online</p>
        </div>
        
        {/* VS Divider */}
        <div className="vs-divider text-center">
          <div className="relative">
            <motion.div 
              className="text-3xl font-bold text-orange-500"
              animate={{ 
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              VS
            </motion.div>
            <div className="absolute inset-0 -z-10">
              <motion.div 
                className="w-full h-full bg-orange-500/20 rounded-full blur-lg"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
        
        {/* Portland Pack */}
        <div className="pack-location portland text-center">
          <h3 className="text-lg font-bold text-purple-400 mb-2">Portland Pack</h3>
          <motion.div 
            className="count text-4xl font-extrabold"
            key={animatedCounts.portland}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {animatedCounts.portland}
          </motion.div>
          <p className="text-sm text-muted-foreground mt-1">wolves online</p>
        </div>
      </div>
      
      {/* Competitive Stats */}
      <div className="mt-4 text-center">
        <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
          <span>Total Pack: {animatedCounts.salem + animatedCounts.portland}</span>
          <span>•</span>
          <span>
            Leading: {animatedCounts.salem > animatedCounts.portland ? 'Salem' : 
                     animatedCounts.portland > animatedCounts.salem ? 'Portland' : 
                     'Tied!'}
          </span>
        </div>
      </div>
    </div>
  );
}
