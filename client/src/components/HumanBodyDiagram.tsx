import { motion } from "framer-motion";

interface HumanBodyDiagramProps {
  gender: 'male' | 'female';
  selectedPart: 'head' | 'body' | 'limbs' | 'mental' | null;
  onPartClick: (part: 'head' | 'body' | 'limbs' | 'mental') => void;
  selectedCounts?: { head: number; body: number; limbs: number; mental: number };
}

const regions = [
  { id: 'head' as const, label: '头部', top: '0%', height: '20%', left: '20%', width: '60%' },
  { id: 'body' as const, label: '身体', top: '20%', height: '35%', left: '10%', width: '80%' },
  { id: 'limbs' as const, label: '四肢', top: '55%', height: '45%', left: '5%', width: '90%' },
];

export function HumanBodyDiagram({ gender, selectedPart, onPartClick }: HumanBodyDiagramProps) {
  const imageSrc = gender === 'male' ? '/male_body.png' : '/female_body.png';
  const isMale = gender === 'male';

  const accentBg = isMale ? 'rgba(59, 130, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)';
  const activeBg = isMale ? 'rgba(59, 130, 246, 0.3)' : 'rgba(236, 72, 153, 0.3)';
  const borderActive = isMale ? 'rgba(59, 130, 246, 0.7)' : 'rgba(236, 72, 153, 0.7)';
  const labelBg = isMale ? 'bg-blue-500' : 'bg-pink-500';
  const labelBgLight = isMale ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200';
  const mentalActive = isMale
    ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-200'
    : 'bg-pink-500 text-white border-pink-600 shadow-lg shadow-pink-200';
  const mentalInactive = isMale
    ? 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
    : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-600 hover:shadow-md';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Body image container with clickable overlay regions */}
      <div className="relative" style={{ width: '260px', height: '466px' }}>
        {/* Body image */}
        <motion.img
          src={imageSrc}
          alt={isMale ? '男性人体' : '女性人体'}
          className="w-full h-full object-contain select-none pointer-events-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          draggable={false}
        />

        {/* Clickable overlay regions */}
        {regions.map((region) => {
          const isActive = selectedPart === region.id;
          return (
            <motion.div
              key={region.id}
              className="absolute cursor-pointer rounded-2xl flex items-center justify-center"
              style={{
                top: region.top,
                left: region.left,
                width: region.width,
                height: region.height,
                background: isActive ? activeBg : 'transparent',
                border: isActive ? `2px solid ${borderActive}` : '2px solid transparent',
                transition: 'background 0.3s, border 0.3s',
              }}
              whileHover={{
                background: isActive ? activeBg : accentBg,
                border: `2px solid ${borderActive}`,
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPartClick(region.id)}
            >
              <span
                className={`text-sm font-bold px-4 py-1.5 rounded-full border transition-all duration-300 ${
                  isActive
                    ? `${labelBg} text-white border-transparent shadow-md`
                    : `${labelBgLight} border backdrop-blur-sm`
                }`}
              >
                {region.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Mental State Button */}
      <motion.button
        onClick={() => onPartClick('mental')}
        className={`px-8 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 border ${
          selectedPart === 'mental' ? mentalActive : mentalInactive
        }`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        🧠 精神状态
      </motion.button>

      {/* Instruction */}
      <p className="text-xs text-gray-400">
        点击身体部位选择症状区域
      </p>
    </div>
  );
}
