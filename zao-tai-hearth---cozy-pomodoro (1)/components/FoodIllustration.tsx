
import React from 'react';

interface FoodIllustrationProps {
  name: string;
  className?: string;
  inPot?: boolean; // 新增：是否在锅内显示的模式
}

const FoodIllustration: React.FC<FoodIllustrationProps> = ({ name, className = "", inPot = false }) => {
  const renderIcon = () => {
    // 根据是否在锅内，调整缩放和平移，使食材填满 100x100 的 ViewBox
    const potTransform = inPot ? "scale(1.3) translate(-12, -12)" : "";

    switch (name) {
      case 'lurou': // 古法卤肉饭
        return (
          <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-md`}>
            {!inPot && (
              <>
                <path d="M12 45 Q12 88 50 88 Q88 88 88 45 Z" fill="#d7ccc8" stroke="#5d4037" strokeWidth="1.2" />
                <ellipse cx="50" cy="45" rx="38" ry="12" fill="#efebe9" stroke="#5d4037" strokeWidth="1.2" />
              </>
            )}
            <g transform={inPot ? "scale(1.4) translate(-14, -15)" : ""}>
              {/* 米饭底色 - 锅内模式下作为背景面 */}
              <ellipse cx="50" cy="50" rx={inPot ? "45" : "34"} ry={inPot ? "35" : "10"} fill="#ffffff" />
              
              {/* 卤肉块：锅内模式下增加数量，显得更丰盛 */}
              <g fill="#3e2723">
                <rect x="25" y="35" width="12" height="10" rx="2" transform="rotate(10 25 35)" />
                <rect x="40" y="32" width="14" height="11" rx="2.5" transform="rotate(-5 40 32)" />
                <rect x="30" y="48" width="16" height="12" rx="2.5" transform="rotate(15 30 48)" />
                <rect x="55" y="40" width="12" height="9" rx="2" />
                <rect x="48" y="28" width="15" height="11" rx="2.5" />
                {inPot && (
                  <>
                    <rect x="15" y="45" width="10" height="8" rx="2" />
                    <rect x="65" y="45" width="12" height="10" rx="2" />
                    <rect x="40" y="55" width="15" height="12" rx="2.5" />
                  </>
                )}
                <path d="M20 45 Q50 65 80 45" fill="#5d4037" opacity="0.3" />
              </g>
              
              {/* 葱花 */}
              <g fill="#4caf50">
                <circle cx="35" cy="52" r="1.5" /><circle cx="42" cy="55" r="1.2" />
                <circle cx="30" cy="58" r="1.5" /><circle cx="58" cy="48" r="1.2" />
                <circle cx="48" cy="53" r="1.5" /><circle cx="65" cy="55" r="1.5" />
              </g>

              {/* 卤蛋 */}
              <g transform={`translate(${inPot ? '10, 5' : '0, 0'}) rotate(8 65 48)`}>
                <ellipse cx="65" cy="48" rx="16" ry="13" fill="#ffffff" stroke="#8d6e63" strokeWidth="0.8" />
                <circle cx="68" cy="49" r="7.5" fill="#ffb300" />
                <circle cx="69" cy="47" r="3" fill="#ffffff" opacity="0.4" />
              </g>
            </g>
          </svg>
        );
      case 'rice': // 竹筒糯米饭
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <g transform={inPot ? "scale(1.2) translate(-8, -10)" : ""}>
              {inPot ? (
                // 锅内模式：多个竹筒紧密排列，填满锅底
                <g>
                  {[
                    {x:20, y:30, h:50, c:'#558b2f'}, {x:42, y:25, h:60, c:'#689f38'}, 
                    {x:65, y:35, h:45, c:'#33691e'}, {x:32, y:45, h:40, c:'#7cb342'}
                  ].map((t, i) => (
                    <g key={i}>
                      <rect x={t.x} y={t.y} width="20" height={t.h} fill={t.c} stroke="#1a2e05" strokeWidth="0.5" />
                      <ellipse cx={t.x + 10} cy={t.y} rx="10" ry="5" fill="#f5f5f5" stroke="#1a2e05" strokeWidth="0.5" />
                      <circle cx={t.x + 8} cy={t.y} r="1.2" fill="#ef5350" />
                    </g>
                  ))}
                </g>
              ) : (
                <g>
                  <rect x="38" y="30" width="24" height="55" fill="#689f38" stroke="#33691e" strokeWidth="1" />
                  <ellipse cx="50" cy="30" rx="12" ry="6" fill="#f5f5f5" stroke="#33691e" strokeWidth="1" />
                  <g fill="#ef5350">
                    <circle cx="48" cy="31" r="1.5" /><circle cx="53" cy="29" r="1.5" />
                  </g>
                </g>
              )}
            </g>
          </svg>
        );
      case 'stew': // 腌笃鲜
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {!inPot && (
              <>
                <path d="M12 45 Q12 85 50 85 Q88 85 88 45 Z" fill="#4e342e" stroke="#212121" strokeWidth="1.5" />
                <ellipse cx="50" cy="45" rx="38" ry="12" fill="#5d4037" stroke="#212121" strokeWidth="1" />
              </>
            )}
            <g transform={inPot ? "scale(1.2) translate(-8, -10)" : ""}>
              <ellipse cx="50" cy="43" rx={inPot ? "48" : "34"} ry={inPot ? "38" : "10"} fill="#fffde7" />
              {/* 更多的肉和笋 */}
              <rect x="20" y="35" width="22" height="14" rx="2" fill="#ef9a9a" transform="rotate(-15 20 35)" />
              <rect x="55" y="30" width="20" height="12" rx="2" fill="#e53935" transform="rotate(10 55 30)" />
              <path d="M40 50 L55 50 L48 68 Z" fill="#fff59d" stroke="#fbc02d" strokeWidth="0.5" />
              {inPot && (
                <>
                  <rect x="40" y="45" width="18" height="12" rx="2" fill="#ef9a9a" opacity="0.8" />
                  <path d="M65 55 L78 55 L72 70 Z" fill="#fff59d" opacity="0.9" />
                  <circle cx="30" cy="60" r="3" fill="#166534" opacity="0.6" />
                </>
              )}
            </g>
          </svg>
        );
      case 'cake': // 腊肉年糕
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {!inPot && (
              <>
                <path d="M15 55 Q15 75 50 75 Q85 75 85 55 Z" fill="#cfd8dc" stroke="#455a64" strokeWidth="1" />
                <ellipse cx="50" cy="55" rx="35" ry="10" fill="#ffffff" stroke="#455a64" strokeWidth="1" />
              </>
            )}
            <g transform={inPot ? "scale(1.3) translate(-12, -12)" : ""}>
              <g>
                <ellipse cx="35" cy="50" rx="14" ry="7" fill="#f5f5f5" stroke="#b0bec5" strokeWidth="0.5" transform="rotate(20 35 50)" />
                <ellipse cx="55" cy="55" rx="14" ry="7" fill="#f5f5f5" stroke="#b0bec5" strokeWidth="0.5" transform="rotate(-10 55 55)" />
                <rect x="25" y="42" width="20" height="8" rx="1" fill="#b71c1c" transform="rotate(-5 25 42)" />
                <rect x="50" y="48" width="18" height="10" rx="1" fill="#7f0000" transform="rotate(15 50 48)" />
                {inPot && (
                  <>
                    <ellipse cx="45" cy="40" rx="12" ry="6" fill="#f5f5f5" />
                    <rect x="35" y="58" width="15" height="7" fill="#b71c1c" />
                    <path d="M20 60 L40 70" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" />
                  </>
                )}
              </g>
            </g>
          </svg>
        );
      case 'fish': // 豆腐鱼头汤
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {!inPot && (
              <>
                <path d="M12 45 Q12 85 50 85 Q88 85 88 45 Z" fill="#b0bec5" stroke="#263238" strokeWidth="1" />
                <ellipse cx="50" cy="45" rx="38" ry="12" fill="#ffffff" stroke="#263238" strokeWidth="1" />
              </>
            )}
            <g transform={inPot ? "scale(1.2) translate(-8, -10)" : ""}>
              <ellipse cx="50" cy="46" rx={inPot ? "48" : "34"} ry={inPot ? "38" : "10"} fill="#eceff1" />
              <path d="M20 45 Q40 20 80 45 Q40 70 20 45 Z" fill="#78909c" stroke="#263238" strokeWidth="1" />
              <circle cx="32" cy="42" r="3" fill="#212121" />
              <rect x="55" y="52" width="14" height="14" rx="1" fill="#ffffff" stroke="#cfd8dc" strokeWidth="0.5" />
              {inPot && (
                <>
                  <rect x="40" y="58" width="12" height="12" fill="#ffffff" />
                  <rect x="65" y="40" width="10" height="10" fill="#ffffff" />
                  <path d="M70 30 Q80 25 85 35" stroke="#166534" strokeWidth="2" fill="none" />
                </>
              )}
            </g>
          </svg>
        );
      case 'noodle': // 番茄鸡蛋面
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {!inPot && (
              <>
                <path d="M12 45 Q12 85 50 85 Q88 85 88 45 Z" fill="#ffcdd2" stroke="#d32f2f" strokeWidth="1" />
                <ellipse cx="50" cy="45" rx="38" ry="12" fill="#ffffff" stroke="#d32f2f" strokeWidth="1" />
              </>
            )}
            <g transform={inPot ? "scale(1.3) translate(-12, -12)" : ""}>
              <ellipse cx="50" cy="46" rx={inPot ? "48" : "34"} ry={inPot ? "38" : "10"} fill="#fff8e1" />
              <path d="M20 40 Q50 70 80 40 M25 45 Q50 75 75 45 M30 50 Q50 80 70 50" fill="none" stroke="#fbc02d" strokeWidth="3" />
              <circle cx="40" cy="40" r="10" fill="#f44336" opacity="0.9" />
              <circle cx="65" cy="42" r="9" fill="#ffffff" />
              <circle cx="68" cy="42" r="5" fill="#ffb300" />
              {inPot && (
                <circle cx="50" cy="55" r="8" fill="#f44336" opacity="0.8" />
              )}
            </g>
          </svg>
        );
      case 'milktea':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M35 25 L65 25 L60 85 L40 85 Z" fill="#efebe9" stroke="#3e2723" strokeWidth="1.5" />
            <ellipse cx="50" cy="25" rx="15" ry="5" fill="#fdfbf7" stroke="#3e2723" strokeWidth="1.5" />
            <circle cx="45" cy="72" r="2" fill="#000" /><circle cx="52" cy="75" r="2" fill="#000" />
            <path d="M50 10 L50 80" stroke="#5d4037" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'apple':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50 85 Q30 85 25 65 Q25 45 50 45 Q75 45 75 65 Q70 85 50 85" fill="#e53935" />
            <path d="M50 45 L50 35" stroke="#3e2723" strokeWidth="2" />
            <path d="M50 35 Q60 30 65 40" fill="#43a047" />
          </svg>
        );
      default:
        return <span className="text-4xl">🍲</span>;
    }
  };

  return <div className={`flex items-center justify-center ${className}`}>{renderIcon()}</div>;
};

export default FoodIllustration;
