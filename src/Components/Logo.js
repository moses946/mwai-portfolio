import React from 'react';
import { Terminal } from 'lucide-react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <Terminal size={20} className="text-gray-600" />
      <code className="rounded bg-gray-200 p-2 text-lg">
        <span className="text-gray-800">#!/bin/</span>
        <span className="text-purple-600">mwai</span>
      </code>
    </div>
  );
};

export default Logo;
