import React from 'react';

export default function Logo() {
  return (
    <div className='flex flex-row items-center leading-none text-white'>
      <img src="/logo.svg" height="192" />
      <p className="text-[44px]-color-primary">APTRS</p>
    </div>
  );
}