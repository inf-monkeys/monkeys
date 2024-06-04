import React from 'react';

interface IVinesAbstractVideoProps {
  children: string;
}

export const VinesAbstractVideo: React.FC<IVinesAbstractVideoProps> = ({ children }) => {
  return (
    <div className="overflow-hidden rounded-md shadow">
      <video autoPlay className="max-h-96 w-full cursor-pointer" controls muted>
        <source src={children} />
      </video>
    </div>
  );
};
