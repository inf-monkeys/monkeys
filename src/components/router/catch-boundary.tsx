import { motion } from 'framer-motion';

interface ErrorBoundaryProps {
  error: Error;
}

export function ErrorComponent({ error }: ErrorBoundaryProps) {
  return (
    <motion.div
      key="vines-catch-boundary"
      className="flex max-w-full flex-col gap-4 rounded border border-solid border-white border-opacity-20 bg-slate-1 p-4 shadow backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
    >
      <div className="flex items-center gap-2 font-bold text-red-500">
        <h1 className="leading-tight text-red-10">出现了一些问题</h1>
      </div>
      <p className="max-w-md overflow-hidden rounded bg-gray-10 bg-opacity-10 p-2 text-xs text-red-500 backdrop-blur-sm">
        {error.message}
      </p>
    </motion.div>
  );
}
