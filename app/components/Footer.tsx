export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
              About
            </h3>
            <p className="text-base text-gray-500">
              Free online tool to convert files between different formats. Fast, secure, and easy to use.
            </p>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
              Features
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-base text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Image Converter
                </a>
              </li>
              <li>
                <a
                  href="/documents"
                  className="text-base text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Document Converter
                </a>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/yourusername/file-converter/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Report an Issue
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/yourusername/file-converter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-gray-500 hover:text-gray-900 transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-base text-gray-500">
              © {currentYear} File Converter. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a
                href="/privacy"
                className="text-base text-gray-500 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-base text-gray-500 hover:text-gray-900 transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 