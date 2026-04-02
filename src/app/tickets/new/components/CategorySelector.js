'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { FiAlertCircle, FiTag, FiChevronDown } from 'react-icons/fi';
import { CATEGORY_OPTIONS } from '../constants';

export default function CategorySelector({ user }) {
  console.log("user====>",user)
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <FiTag className="mr-1.5 h-4 w-4 text-primary-500" />
        Branch
      </h2>

      <div  className="relative">
        <button
          type="button"
          onClick={() => {}}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded text-sm `}
        >
          <span className="text-gray-700">{user?.branch}</span>

         
        </button>

        
      </div>

      
    </div>
  );
}