import React from 'react';

import Image from 'rc-image';

export const FeishuIcon: React.FC<React.ComponentPropsWithoutRef<'img'>> = ({ className, ...props }) => {
  return (
    <Image
      src={
        'https://p1-hera.feishucdn.com/tos-cn-i-jbbdkfciu3/84a9f036fe2b44f99b899fff4beeb963~tplv-jbbdkfciu3-image:0:0.image'
      }
      alt="feishu"
      width={20}
      height={20}
      style={{
        marginTop: '8px',
      }}
    />
  );
};
