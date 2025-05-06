
import React from 'react';

const AnnouncementSection = () => {
  return (
    <div className="bg-gradient-to-r from-purple-900 to-purple-700 rounded-lg shadow-md p-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Watch Hindi-English Dubbed titles, Visit our website or Telegram channel. Facing issues? Report to us right away
        </h3>
        <div className="flex justify-center gap-4 mt-4">
          <a
            href="https://t.me/auralux1"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0088cc] hover:bg-[#0099dd] text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 8.12-1.56 7.34c-.12.52-.67.79-1.12.53l-3.16-2.24-1.63 1.6c-.1.1-.35.24-.46.24-.17 0-.14-.13-.2-.47l-.45-3.25-2.77-1.23a.76.76 0 0 1 .05-1.44l11.09-4.18c.4-.14.82.22.7.63l.51 2.47z" />
            </svg>
            Join Telegram
          </a>
          <a
            href="/"
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Visit Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementSection;
