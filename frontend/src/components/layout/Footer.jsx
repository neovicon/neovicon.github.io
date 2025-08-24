import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Twitter, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-primary">Intelixir</span>
            </div>
            <p className="text-gray-300 max-w-md">
              AI-powered social news platform that delivers personalized content, 
              intelligent discussions, and real-time insights from around the world.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="https://twitter.com/intelixir" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://github.com/intelixir" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/intelixir" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:hello@intelixir.com" className="text-gray-400 hover:text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="text-gray-300 hover:text-primary block transition-colors">
                Home
              </Link>
              <Link to="/categories" className="text-gray-300 hover:text-primary block transition-colors">
                Categories
              </Link>
              <Link to="/contact" className="text-gray-300 hover:text-primary block transition-colors">
                Contact Us
              </Link>
              <Link to="/about" className="text-gray-300 hover:text-primary block transition-colors">
                About
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <div className="space-y-2">
              <Link to="/privacy" className="text-gray-300 hover:text-primary block transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-300 hover:text-primary block transition-colors">
                Terms of Service
              </Link>
              <Link to="/gdpr" className="text-gray-300 hover:text-primary block transition-colors">
                GDPR Compliance
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {currentYear} Intelixir. All rights reserved. Powered by AI for a smarter world.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


