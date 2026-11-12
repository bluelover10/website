// Palette definition for LeftPanel + Dnd. Array of {type,label,icon,category,defaultProps,allowChildren}.
import {
  Box, LayoutTemplate, Heading1, Type, Image as ImageIcon, MousePointerClick,
  Link2, Minus, Square, Navigation, Rocket, CreditCard, LayoutGrid,
  MessageSquareQuote, BadgeDollarSign, HelpCircle, GalleryHorizontal, Mail,
  ArrowDownToLine, Play, Share2,
} from 'lucide-react';
import { DEFAULT_PROPS, ALLOW_CHILDREN } from '../utils/componentDefaults';

function entry(type, label, icon, category) {
  return { type, label, icon, category, defaultProps: DEFAULT_PROPS[type] || {}, allowChildren: !!ALLOW_CHILDREN[type] };
}

export const COMPONENT_LIBRARY = [
  entry('container', 'Container', Box, 'Layout'),
  entry('section', 'Section', LayoutTemplate, 'Layout'),
  entry('divider', 'Divider', Minus, 'Layout'),
  entry('spacer', 'Spacer', Square, 'Layout'),
  entry('heading', 'Heading', Heading1, 'Typography'),
  entry('text', 'Text', Type, 'Typography'),
  entry('link', 'Link', Link2, 'Typography'),
  entry('image', 'Image', ImageIcon, 'Media'),
  entry('video', 'Video', Play, 'Media'),
  entry('gallery', 'Gallery', GalleryHorizontal, 'Media'),
  entry('button', 'Button', MousePointerClick, 'Interactive'),
  entry('faq', 'FAQ', HelpCircle, 'Interactive'),
  entry('contactForm', 'Contact Form', Mail, 'Interactive'),
  entry('navbar', 'Navbar', Navigation, 'Sections'),
  entry('hero', 'Hero', Rocket, 'Sections'),
  entry('card', 'Card', CreditCard, 'Sections'),
  entry('featureGrid', 'Feature Grid', LayoutGrid, 'Sections'),
  entry('testimonials', 'Testimonials', MessageSquareQuote, 'Sections'),
  entry('pricing', 'Pricing', BadgeDollarSign, 'Sections'),
  entry('footer', 'Footer', ArrowDownToLine, 'Sections'),
  entry('socialLinks', 'Social Links', Share2, 'Sections'),
];

export const CATEGORIES = ['Layout', 'Typography', 'Media', 'Interactive', 'Sections'];

export default COMPONENT_LIBRARY;
