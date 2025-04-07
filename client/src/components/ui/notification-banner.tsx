import { useState, useEffect, createContext, useContext } from "react";

type NotificationContextType = {
  showNotification: (message: string, duration?: number) => void;
};

export const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = (newMessage: string, duration = 3000) => {
    setMessage(newMessage);
    setIsVisible(true);
    
    setTimeout(() => {
      setIsVisible(false);
    }, duration);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationBanner message={message} isVisible={isVisible} />
    </NotificationContext.Provider>
  );
}

type NotificationBannerProps = {
  message?: string;
  isVisible?: boolean;
};

export function NotificationBanner({ 
  message = "", 
  isVisible = false 
}: NotificationBannerProps) {
  const [visible, setVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // On first load, show welcome message
  useEffect(() => {
    const hasShownWelcome = sessionStorage.getItem("welcomeShown");
    
    if (!hasShownWelcome) {
      setNotificationMessage("Welcome bonus! 1000 free credits added to your account!");
      setVisible(true);
      
      setTimeout(() => {
        setVisible(false);
      }, 4000);
      
      sessionStorage.setItem("welcomeShown", "true");
    }
  }, []);

  // For dynamic notifications
  useEffect(() => {
    if (message && isVisible) {
      setNotificationMessage(message);
      setVisible(true);
    } else if (!isVisible && message) {
      setVisible(false);
    }
  }, [message, isVisible]);

  return (
    <div 
      className={`fixed w-full bg-[#F8BF0C] text-[#232131] font-sans py-3 px-4 text-center z-50 transition-transform duration-300 ease-in-out ${
        visible ? "transform-none" : "-translate-y-full"
      }`}
    >
      {notificationMessage}
    </div>
  );
}
