import { defineConfig } from 'vite';

// Hai trang: thiệp (index.html) và trang tạo link mời (tao-link.html, không có link nào dẫn tới).
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: 'index.html',
        taoLink: 'tao-link.html',
      },
    },
  },
});
