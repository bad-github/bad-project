import {ImageUploadNode} from '@workspace/editor/components/tiptap-node/image-upload-node';
import {handleImageUpload, MAX_FILE_SIZE} from '@workspace/editor/lib/tiptap-utils';

export const ImageUploadButtonExtension = [
  // StarterKit,
  // Image,
  ImageUploadNode.configure({
    accept: 'image/*',
    maxSize: MAX_FILE_SIZE,
    limit: 3,
    upload: handleImageUpload,
    onError: (error) => console.error('Upload failed:', error),
  }),
];
