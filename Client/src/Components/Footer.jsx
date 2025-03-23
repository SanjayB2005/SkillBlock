import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-black to-blue-950 text-white overflow-hidden">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* First Segment - About */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-blue-300">FreelanceChain</h3>
            <p className="text-gray-300 text-sm">
              The premier platform connecting skilled freelancers with clients through 
              blockchain-secured contracts and decentralized learning opportunities.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-blue-400 hover:text-blue-200 transition duration-300">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-blue-400 hover:text-blue-200 transition duration-300">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#" className="text-blue-400 hover:text-blue-200 transition duration-300">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Second Segment - Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-blue-300">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-blue-300 transition duration-300">Find Freelancers</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-300 transition duration-300">Post a Project</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-300 transition duration-300">Skill Marketplace</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-300 transition duration-300">Learning Hub</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-300 transition duration-300">Community Forum</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-300 transition duration-300">Blockchain Security</a></li>
            </ul>
          </div>
          
          {/* Third Segment - Newsletter */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-blue-300">Stay Updated</h3>
            <p className="text-gray-300 text-sm">
              Subscribe to our newsletter for the latest updates, features, and opportunities.
            </p>
            <form className="mt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  className="px-4 py-2 bg-blue-950 border border-blue-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 flex-grow"
                  placeholder="Your email address"
                />
                <button
                  type="submit"
                  className="bg-cyan-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-cyan-300 transform hover:scale-105 transition duration-300 shadow-lg"
                >
                  Join Now
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-400 mt-2">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-blue-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-blue-400">
            &copy; {new Date().getFullYear()} FreelanceChain. All rights reserved.
          </p>
          <div className="mt-4 sm:mt-0">
            <ul className="flex space-x-6">
              <li><a href="#" className="text-xs text-blue-400 hover:text-blue-200">Privacy Policy</a></li>
              <li><a href="#" className="text-xs text-blue-400 hover:text-blue-200">Terms of Service</a></li>
              <li><a href="#" className="text-xs text-blue-400 hover:text-blue-200">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Add this default export line - this is what was missing
export default Footer;