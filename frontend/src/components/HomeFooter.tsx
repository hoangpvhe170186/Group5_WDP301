export default function HomeFooter() {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
              HE
            </div>
            <span className="font-bold text-gray-900">Home Express</span>
          </div>
          
          <div className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Home Express – Home Express System. All rights reserved.
          </div>
          
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors duration-200">Terms</a>
            <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors duration-200">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors duration-200">Help</a>
          </div>
        </div>
      </div>
    </footer>
  );
}