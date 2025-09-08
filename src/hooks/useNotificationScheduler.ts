import { useState, useEffect } from 'react';
import { notificationSystemService } from '../services/notificationSystem';

export const useNotificationScheduler = (userId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Set up interval to check for scheduled notifications every minute
    const interval = setInterval(async () => {
      if (isProcessing) return;
      
      setIsProcessing(true);
      try {
        await notificationSystemService.processScheduledNotifications();
      } catch (error) {
        console.error('Error processing scheduled notifications:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 60000); // Check every minute

    // Initial check
    notificationSystemService.processScheduledNotifications().catch(console.error);

    return () => clearInterval(interval);
  }, [userId, isProcessing]);

  return { isProcessing };
};