const TailWindCss = () => {
  return (
    <div>
      {/* tailwind.config.ts */}
      <div className="text-custom-red">aa</div>
      <div className="text-customBlue">cc</div>
      <div className="border border-custom-color-js">ee</div>
      {/* 自定义类 */}
      <div className="custom-color1-class">ee</div>
      {/* root变量 */}
      <div style={{color: 'var(--custom-color1)'}}>ff</div>
      {/* theme变量 */}
      <div className="text-custom-color2">gg</div>
      <div style={{color: 'var(--color-custom-color2)'}}>hh</div>
      <div className="text-custom-color3">ii</div>
      {/* todo */}
      <button style={{color: 'var(--btn-color)'}}>按钮</button>
      <div className="button2">
        <button style={{color: 'var(--btn-color)'}}>按钮</button>
      </div>
    </div>
  );
};

export default TailWindCss;
