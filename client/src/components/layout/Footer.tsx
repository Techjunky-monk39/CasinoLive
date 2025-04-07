export default function Footer() {
  return (
    <footer className="bg-[#232131] mt-10 py-6 border-t border-[#331D5C] border-opacity-30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-[#F8BF0C] font-montserrat font-bold text-xl">Royal Flush Casino</h2>
            <p className="text-gray-400 text-sm mt-1">Experience the thrill of virtual gaming</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-[#F8BF0C] transition-colors duration-300">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-[#F8BF0C] transition-colors duration-300">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-[#F8BF0C] transition-colors duration-300">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-[#F8BF0C] transition-colors duration-300">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            This is a simulation for entertainment purposes only. No real money gambling.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            &copy; 2023 Royal Flush Casino. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
