export const preventNumberInputScroll = (e: React.WheelEvent<HTMLInputElement>) => {
  const target = e.target as HTMLInputElement;
  if (document.activeElement === target) {
    e.preventDefault();
    target.blur();
  } else {
    e.preventDefault();
  }
};