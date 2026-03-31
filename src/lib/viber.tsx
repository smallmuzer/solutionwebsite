import React from "react";
import { toast } from "sonner";

export const openViber = (phoneNumbers: string = "9489477144", shareMessage: string = "Check this out") => {
  const currentUrl = window.location.href;
  const fullText = `${shareMessage}`;
  const encodedMessage = encodeURIComponent(fullText);
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 1. Copy to clipboard for reliability
  navigator.clipboard.writeText(fullText).then(() => {
    // 2. Try to open Viber
    const numbersArray = phoneNumbers.split(',').map(num => num.trim().replace('+', '')).filter(num => num);

    if (phoneNumbers && phoneNumbers.length >= 10) {
      if (isMobile) {
        window.location.href = `viber://forward?text=${encodedMessage}&contacts=${numbersArray.join(',')}`;
      } else {
        window.location.href = `viber://chat?number=${phoneNumbers.replace('+', '')}`;

        setTimeout(() => {
          toast.info("Message copied! Paste it in the Viber window that just opened.");
        }, 800);
      }
    } else {
      // Fallback share
      window.location.href = `viber://forward?text=${encodedMessage}`;
      toast.info("Viber should open now. If not, the message is in your clipboard!");
    }
  }).catch(() => {
    // If clipboard fails, just try opening Viber
    window.location.href = `viber://forward?text=${encodedMessage}`;
  });
};

export const VIBER_COLOR = "#7360F2";

export const ViberIcon: React.FC<{ size?: number, className?: string }> = ({ size = 18, className = "" }) => {
  return (
    <img
      src="/logo.png"
      alt="Website Logo"
      style={{ width: size, height: size, objectFit: "contain" }}
      className={className}
    />
  );
};
