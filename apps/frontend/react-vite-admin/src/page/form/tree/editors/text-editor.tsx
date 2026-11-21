import {InputOTP, InputOTPGroup, InputOTPSlot} from '@badnpm/ui';
import {inputAttributes, type EditorProps} from './types';

/** 普通文本已交给非受控编辑器；OTP 仍需组合多个槽位并由 RHF 驱动选中值。 */
export default function TextEditor(props: EditorProps) {
  const {config, value, onChange, inputRef} = props;
  if (config.type !== 'input-otp') return null;
  return (
    <InputOTP
      {...inputAttributes(props)}
      ref={inputRef}
      maxLength={config.length}
      pattern="[0-9]*"
      value={typeof value === 'string' ? value : ''}
      onChange={onChange}
    >
      <InputOTPGroup>
        {Array.from({length: config.length}, (_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
