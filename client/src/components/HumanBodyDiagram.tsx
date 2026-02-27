import { motion } from "framer-motion";

interface HumanBodyDiagramProps {
  selectedPart: 'head' | 'body' | 'limbs' | 'mental' | null;
  onPartClick: (part: 'head' | 'body' | 'limbs' | 'mental') => void;
}

export function HumanBodyDiagram({ selectedPart, onPartClick }: HumanBodyDiagramProps) {
  const partColors = {
    head: selectedPart === 'head' ? '#3b82f6' : '#cbd5e1',
    body: selectedPart === 'body' ? '#3b82f6' : '#cbd5e1',
    limbs: selectedPart === 'limbs' ? '#3b82f6' : '#cbd5e1',
    mental: selectedPart === 'mental' ? '#a855f7' : '#cbd5e1',
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <svg
        width="300"
        height="500"
        viewBox="0 0 300 500"
        className="drop-shadow-lg"
      >
        {/* Head */}
        <motion.g
          onClick={() => onPartClick('head')}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ellipse
            cx="150"
            cy="60"
            rx="40"
            ry="50"
            fill={partColors.head}
            stroke="#1e293b"
            strokeWidth="2"
            className="transition-colors duration-300"
          />
          <text
            x="150"
            y="65"
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
          >
            头部
          </text>
        </motion.g>

        {/* Neck */}
        <rect
          x="135"
          y="105"
          width="30"
          height="25"
          fill="#94a3b8"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Body/Torso */}
        <motion.g
          onClick={() => onPartClick('body')}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <rect
            x="100"
            y="130"
            width="100"
            height="150"
            rx="20"
            fill={partColors.body}
            stroke="#1e293b"
            strokeWidth="2"
            className="transition-colors duration-300"
          />
          <text
            x="150"
            y="210"
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
          >
            身体
          </text>
        </motion.g>

        {/* Left Arm */}
        <motion.g
          onClick={() => onPartClick('limbs')}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <rect
            x="50"
            y="140"
            width="45"
            height="120"
            rx="15"
            fill={partColors.limbs}
            stroke="#1e293b"
            strokeWidth="2"
            className="transition-colors duration-300"
          />
        </motion.g>

        {/* Right Arm */}
        <motion.g
          onClick={() => onPartClick('limbs')}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <rect
            x="205"
            y="140"
            width="45"
            height="120"
            rx="15"
            fill={partColors.limbs}
            stroke="#1e293b"
            strokeWidth="2"
            className="transition-colors duration-300"
          />
        </motion.g>

        {/* Left Leg */}
        <motion.g
          onClick={() => onPartClick('limbs')}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <rect
            x="110"
            y="285"
            width="35"
            height="180"
            rx="15"
            fill={partColors.limbs}
            stroke="#1e293b"
            strokeWidth="2"
            className="transition-colors duration-300"
          />
          <text
            x="127"
            y="380"
            textAnchor="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
          >
            四肢
          </text>
        </motion.g>

        {/* Right Leg */}
        <motion.g
          onClick={() => onPartClick('limbs')}
          className="cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <rect
            x="155"
            y="285"
            width="35"
            height="180"
            rx="15"
            fill={partColors.limbs}
            stroke="#1e293b"
            strokeWidth="2"
            className="transition-colors duration-300"
          />
        </motion.g>
      </svg>

      {/* Mental State Button (separate from body diagram) */}
      <motion.button
        onClick={() => onPartClick('mental')}
        className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
          selectedPart === 'mental'
            ? 'bg-purple-500 shadow-lg'
            : 'bg-gray-400 hover:bg-purple-400'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🧠 精神状态
      </motion.button>
    </div>
  );
}
