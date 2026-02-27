import { motion } from "framer-motion";

interface HumanBodyDiagramProps {
  gender: 'male' | 'female';
  selectedPart: 'head' | 'body' | 'limbs' | 'mental' | null;
  onPartClick: (part: 'head' | 'body' | 'limbs' | 'mental') => void;
  selectedCounts?: { head: number; body: number; limbs: number; mental: number };
}

export function HumanBodyDiagram({ gender, selectedPart, onPartClick, selectedCounts }: HumanBodyDiagramProps) {
  const baseColor = '#d1d5db';
  const activeColor = '#2563eb';
  const hoverColor = '#60a5fa';

  const getColor = (part: 'head' | 'body' | 'limbs' | 'mental') => {
    if (selectedPart === part) return activeColor;
    return baseColor;
  };

  const getStroke = (part: 'head' | 'body' | 'limbs' | 'mental') => {
    if (selectedPart === part) return '#1d4ed8';
    return '#9ca3af';
  };

  // Labels positioned outside the body
  const labels = [
    { part: 'head' as const, label: '头部', x: 280, y: 55 },
    { part: 'body' as const, label: '身体', x: 280, y: 220 },
    { part: 'limbs' as const, label: '四肢', x: 280, y: 400 },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="320"
        height="520"
        viewBox="0 0 320 520"
        className="drop-shadow-md"
      >
        {gender === 'male' ? (
          /* ===== MALE SILHOUETTE ===== */
          <>
            {/* Head */}
            <motion.g
              onClick={() => onPartClick('head')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '150px 50px' }}
            >
              <path
                d="M150 10 C120 10, 105 30, 105 55 C105 80, 120 100, 150 100 C180 100, 195 80, 195 55 C195 30, 180 10, 150 10 Z"
                fill={getColor('head')}
                stroke={getStroke('head')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Neck */}
            <path
              d="M135 98 L135 118 L165 118 L165 98"
              fill={baseColor}
              stroke="#9ca3af"
              strokeWidth="1.5"
            />

            {/* Body / Torso - broader shoulders */}
            <motion.g
              onClick={() => onPartClick('body')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '150px 210px' }}
            >
              <path
                d="M135 118 L90 130 L80 140 L78 180 L82 240 L88 280 L100 300 L120 310 L150 315 L180 310 L200 300 L212 280 L218 240 L222 180 L220 140 L210 130 L165 118 Z"
                fill={getColor('body')}
                stroke={getStroke('body')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Left Arm */}
            <motion.g
              onClick={() => onPartClick('limbs')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '55px 220px' }}
            >
              <path
                d="M80 140 L65 145 L52 170 L45 220 L42 270 L40 310 L38 340 L42 345 L50 342 L52 320 L55 280 L60 240 L65 200 L72 170 L78 150 Z"
                fill={getColor('limbs')}
                stroke={getStroke('limbs')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Right Arm */}
            <motion.g
              onClick={() => onPartClick('limbs')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '245px 220px' }}
            >
              <path
                d="M220 140 L235 145 L248 170 L255 220 L258 270 L260 310 L262 340 L258 345 L250 342 L248 320 L245 280 L240 240 L235 200 L228 170 L222 150 Z"
                fill={getColor('limbs')}
                stroke={getStroke('limbs')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Left Leg */}
            <motion.g
              onClick={() => onPartClick('limbs')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '120px 400px' }}
            >
              <path
                d="M120 310 L110 340 L105 380 L102 420 L100 460 L98 490 L95 505 L100 510 L115 508 L118 495 L118 460 L120 420 L125 380 L130 340 L140 315 L150 315 Z"
                fill={getColor('limbs')}
                stroke={getStroke('limbs')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Right Leg */}
            <motion.g
              onClick={() => onPartClick('limbs')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '180px 400px' }}
            >
              <path
                d="M180 310 L190 340 L195 380 L198 420 L200 460 L202 490 L205 505 L200 510 L185 508 L182 495 L182 460 L180 420 L175 380 L170 340 L160 315 L150 315 Z"
                fill={getColor('limbs')}
                stroke={getStroke('limbs')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>
          </>
        ) : (
          /* ===== FEMALE SILHOUETTE ===== */
          <>
            {/* Head */}
            <motion.g
              onClick={() => onPartClick('head')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '150px 50px' }}
            >
              <path
                d="M150 10 C122 10, 108 32, 108 55 C108 78, 122 98, 150 98 C178 98, 192 78, 192 55 C192 32, 178 10, 150 10 Z"
                fill={getColor('head')}
                stroke={getStroke('head')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Neck - slightly thinner */}
            <path
              d="M137 96 L137 116 L163 116 L163 96"
              fill={baseColor}
              stroke="#9ca3af"
              strokeWidth="1.5"
            />

            {/* Body / Torso - narrower shoulders, wider hips, waist curve */}
            <motion.g
              onClick={() => onPartClick('body')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '150px 210px' }}
            >
              <path
                d="M137 116 L100 128 L92 138 L90 165 L95 195 L92 210 L88 240 L90 270 L98 295 L110 310 L130 318 L150 320 L170 318 L190 310 L202 295 L210 270 L212 240 L208 210 L205 195 L210 165 L208 138 L200 128 L163 116 Z"
                fill={getColor('body')}
                stroke={getStroke('body')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Left Arm - slightly thinner */}
            <motion.g
              onClick={() => onPartClick('limbs')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '60px 220px' }}
            >
              <path
                d="M92 138 L78 142 L66 165 L58 210 L54 260 L50 300 L48 335 L52 340 L58 337 L60 310 L63 270 L68 230 L73 195 L80 165 L88 148 Z"
                fill={getColor('limbs')}
                stroke={getStroke('limbs')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Right Arm */}
            <motion.g
              onClick={() => onPartClick('limbs')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '240px 220px' }}
            >
              <path
                d="M208 138 L222 142 L234 165 L242 210 L246 260 L250 300 L252 335 L248 340 L242 337 L240 310 L237 270 L232 230 L227 195 L220 165 L212 148 Z"
                fill={getColor('limbs')}
                stroke={getStroke('limbs')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Left Leg */}
            <motion.g
              onClick={() => onPartClick('limbs')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '125px 400px' }}
            >
              <path
                d="M130 318 L118 345 L112 380 L108 420 L106 460 L104 490 L102 505 L107 510 L120 508 L122 495 L122 460 L124 420 L128 380 L134 345 L142 320 L150 320 Z"
                fill={getColor('limbs')}
                stroke={getStroke('limbs')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>

            {/* Right Leg */}
            <motion.g
              onClick={() => onPartClick('limbs')}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              style={{ transformOrigin: '175px 400px' }}
            >
              <path
                d="M170 318 L182 345 L188 380 L192 420 L194 460 L196 490 L198 505 L193 510 L180 508 L178 495 L178 460 L176 420 L172 380 L166 345 L158 320 L150 320 Z"
                fill={getColor('limbs')}
                stroke={getStroke('limbs')}
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
            </motion.g>
          </>
        )}

        {/* Labels with connecting lines */}
        {labels.map(({ part, label, x, y }) => (
          <motion.g
            key={part}
            onClick={() => onPartClick(part)}
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          >
            <line
              x1={gender === 'male' ? 222 : 212}
              y1={y}
              x2={x - 30}
              y2={y}
              stroke={selectedPart === part ? activeColor : '#9ca3af'}
              strokeWidth="1"
              strokeDasharray="4 2"
              className="transition-colors duration-300"
            />
            <rect
              x={x - 28}
              y={y - 14}
              width="56"
              height="28"
              rx="6"
              fill={selectedPart === part ? activeColor : '#f3f4f6'}
              stroke={selectedPart === part ? '#1d4ed8' : '#d1d5db'}
              strokeWidth="1"
              className="transition-colors duration-300"
            />
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              fill={selectedPart === part ? 'white' : '#374151'}
              fontSize="13"
              fontWeight="600"
            >
              {label}
            </text>
          </motion.g>
        ))}
      </svg>

      {/* Mental State Button */}
      <motion.button
        onClick={() => onPartClick('mental')}
        className={`px-8 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 border ${
          selectedPart === 'mental'
            ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-200'
            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md'
        }`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        精神状态
      </motion.button>
    </div>
  );
}
