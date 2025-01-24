import NextImage from 'next/image';
import React from "react";

export default function Image({alt, ...props}: { alt: string, [key: string]: any }) {
  const [src, setSrc] = React.useState(props.src);
  const errorSrc = props.error;
  const blurSrc = props.blur;

  return (
    <NextImage
      {...props}
      src={src}
      alt={alt} // To fix lint warning
      onError={() => setSrc(errorSrc || '/item-icon-blur.jpg')}
      placeholder="blur"
      blurDataURL={blurSrc || "/item-icon-blur.jpg"}
    />
  );
}
