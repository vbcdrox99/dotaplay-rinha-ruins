
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/custom/Button';
import { Menu, X, User, LogOut, Shield, Home, Users, BarChart } from 'lucide-react';
import UserProfileModal from './user/UserProfileModal';

const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  
  const toggleProfileModal = () => setShowProfileModal(!showProfileModal);
  const closeProfileModal = () => setShowProfileModal(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { name: 'Início', path: '/', icon: <Home size={18} />, visible: true },
    { name: 'Dashboard', path: '/dashboard', icon: <Users size={18} />, visible: !!user },
    { name: 'Admin', path: '/admin', icon: <Shield size={18} />, visible: isAdmin },
    { name: 'Usuários', path: '/users', icon: <Users size={18} />, visible: isAdmin },
    { name: 'Histórico', path: '/history', icon: <BarChart size={18} />, visible: !!user }
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled 
            ? 'py-2 backdrop-blur bg-gaming-bg-dark bg-opacity-80 shadow-md' 
            : 'py-4 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="font-bold text-xl text-gaming-accent-blue">RINHA<span className="text-white">DE</span><span className="text-gaming-accent-blue">RUINS</span></div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {menuItems
              .filter(item => item.visible)
              .map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-gaming-bg-card text-gaming-accent-blue'
                      : 'text-gaming-text-secondary hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}

            {user ? (
              <div className="flex items-center space-x-3">
                <div 
                  className="flex items-center bg-gaming-bg-card px-3 py-1.5 rounded-lg border border-gaming-border cursor-pointer hover:border-gaming-accent-blue transition-colors"
                  onClick={toggleProfileModal}
                >
                  <User size={16} className="text-gaming-accent-blue mr-2" />
                  <span className="text-sm truncate max-w-[120px]">{user.discordName}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  leftIcon={<LogOut size={16} />}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/">
                <Button variant="primary" size="sm">Entrar</Button>
              </Link>
            )}
          </nav>

          {/* Mobile Navigation Toggle */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden fixed inset-0 z-50 bg-gaming-bg-dark transition-all duration-300 ease-in-out ${
            isMenuOpen 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-full pointer-events-none'
          }`}
        >
          <div className="flex justify-end p-4">
            <button 
              className="text-white focus:outline-none"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex flex-col items-center space-y-6 pt-10">
            {menuItems
              .filter(item => item.visible)
              .map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg w-2/3 justify-center transition-all ${
                    isActive(item.path)
                      ? 'bg-gaming-bg-card text-gaming-accent-blue'
                      : 'text-gaming-text-secondary hover:text-white'
                  }`}
                  onClick={closeMenu}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}

            {user ? (
              <div className="flex flex-col items-center space-y-4 pt-6 w-2/3">
                <div 
                  className="flex items-center bg-gaming-bg-card px-4 py-2 rounded-lg border border-gaming-border w-full justify-center cursor-pointer hover:border-gaming-accent-blue"
                  onClick={() => {
                    closeMenu();
                    toggleProfileModal();
                  }}
                >
                  <User size={18} className="text-gaming-accent-blue mr-2" />
                  <span>{user.discordName}</span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => { logout(); closeMenu(); }}
                  leftIcon={<LogOut size={18} />}
                  className="w-full justify-center"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/" className="pt-6 w-2/3" onClick={closeMenu}>
                <Button variant="primary" className="w-full">Entrar</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      
      {/* User Profile Modal */}
      {showProfileModal && user && (
        <UserProfileModal user={user} isOpen={showProfileModal} onClose={closeProfileModal} />
      )}
    </>
  );
};

export default Header;
