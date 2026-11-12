import React, { useState } from 'react';
import { Flame, Droplets, Leaf, Sword, Shield, RotateCcw, Sparkles, HelpCircle } from 'lucide-react';
import './App.css';

type ElementType = 'fire' | 'water' | 'grass';

interface Card {
  id: string;
  weaponName: string;
  element: ElementType;
  attack: number;
}

interface BattleState {
  playerCard: Card;
  cpuCard: Card;
  playerBonus: number;
  cpuBonus: number;
  playerTotal: number;
  cpuTotal: number;
  outcome: 'win' | 'lose' | 'draw';
  damage: number;
}

const MAX_HP = 100;
const HAND_SIZE = 3;
const ELEMENT_BONUS = 25;

const WEAPON_TEMPLATES: { name: string; element: ElementType; minAtk: number; maxAtk: number }[] = [
  { name: '紅蓮の大剣', element: 'fire', minAtk: 35, maxAtk: 55 },
  { name: 'フレイムランス', element: 'fire', minAtk: 30, maxAtk: 50 },
  { name: 'イフリートダガー', element: 'fire', minAtk: 25, maxAtk: 45 },
  { name: '蒼海のトライデント', element: 'water', minAtk: 35, maxAtk: 55 },
  { name: 'アクアセイバー', element: 'water', minAtk: 30, maxAtk: 50 },
  { name: 'ミストボウ', element: 'water', minAtk: 25, maxAtk: 45 },
  { name: '翠嵐の戦斧', element: 'grass', minAtk: 35, maxAtk: 55 },
  { name: 'リーフスピア', element: 'grass', minAtk: 30, maxAtk: 50 },
  { name: 'ソーンウィップ', element: 'grass', minAtk: 25, maxAtk: 45 },
];

const drawRandomCard = (): Card => {
  const tpl = WEAPON_TEMPLATES[Math.floor(Math.random() * WEAPON_TEMPLATES.length)];
  const atk = Math.floor(Math.random() * (tpl.maxAtk - tpl.minAtk + 1)) + tpl.minAtk;
  return {
    id: Math.random().toString(36).substring(2, 9),
    weaponName: tpl.name,
    element: tpl.element,
    attack: atk,
  };
};

const createInitialHand = (): Card[] => Array.from({ length: HAND_SIZE }, drawRandomCard);

// 属性相性判定: 1 = aが有利, -1 = bが有利, 0 = あいこ
const checkAdvantage = (a: ElementType, b: ElementType): number => {
  if (a === b) return 0;
  if (
    (a === 'fire' && b === 'grass') ||
    (a === 'grass' && b === 'water') ||
    (a === 'water' && b === 'fire')
  ) {
    return 1;
  }
  return -1;
};

export default function App() {
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [cpuHp, setCpuHp] = useState(MAX_HP);
  const [playerHand, setPlayerHand] = useState<Card[]>(createInitialHand);
  const [cpuHand, setCpuHand] = useState<Card[]>(createInitialHand);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [logMessage, setLogMessage] = useState('手札3枚から武器カードを1枚選んでください！');
  const [shakeTarget, setShakeTarget] = useState<'player' | 'cpu' | null>(null);

  const handleSelectCard = (selectedCard: Card) => {
    if (isAnimating || playerHp <= 0 || cpuHp <= 0) return;
    setIsAnimating(true);

    // CPUの手札からランダムに1枚選択
    const cpuIndex = Math.floor(Math.random() * cpuHand.length);
    const cpuCard = cpuHand[cpuIndex];

    // 属性ボーナス計算
    const adv = checkAdvantage(selectedCard.element, cpuCard.element);
    const playerBonus = adv === 1 ? ELEMENT_BONUS : 0;
    const cpuBonus = adv === -1 ? ELEMENT_BONUS : 0;

    const playerTotal = selectedCard.attack + playerBonus;
    const cpuTotal = cpuCard.attack + cpuBonus;

    let outcome: 'win' | 'lose' | 'draw' = 'draw';
    let damage = 0;

    if (playerTotal > cpuTotal) {
      outcome = 'win';
      damage = playerTotal - cpuTotal;
      setCpuHp((prev) => Math.max(0, prev - damage));
      setShakeTarget('cpu');
      setLogMessage(`勝利！相手に ${damage} のダメージを与えた！`);
    } else if (cpuTotal > playerTotal) {
      outcome = 'lose';
      damage = cpuTotal - playerTotal;
      setPlayerHp((prev) => Math.max(0, prev - damage));
      setShakeTarget('player');
      setLogMessage(`敗北… あなたは ${damage} のダメージを受けた！`);
    } else {
      setLogMessage('互角の打ち合い！両者ダメージなし！');
    }

    setBattle({
      playerCard: selectedCard,
      cpuCard,
      playerBonus,
      cpuBonus,
      playerTotal,
      cpuTotal,
      outcome,
      damage,
    });

    // 使ったカードを補充して手札を3枚に保つ
    setTimeout(() => {
      setShakeTarget(null);
      setPlayerHand((prev) =>
        prev.map((c) => (c.id === selectedCard.id ? drawRandomCard() : c))
      );
      setCpuHand((prev) =>
        prev.map((c, idx) => (idx === cpuIndex ? drawRandomCard() : c))
      );
      setIsAnimating(false);
    }, 800);
  };

  const resetGame = () => {
    setPlayerHp(MAX_HP);
    setCpuHp(MAX_HP);
    setPlayerHand(createInitialHand());
    setCpuHand(createInitialHand());
    setBattle(null);
    setIsAnimating(false);
    setLogMessage('バトル開始！手札3枚から1枚選んでください。');
  };

  const renderElementBadge = (element: ElementType) => {
    switch (element) {
      case 'fire':
        return (
          <span className="element-tag" style={{ color: '#f87171' }}>
            <Flame size={14} /> 火属性
          </span>
        );
      case 'water':
        return (
          <span className="element-tag" style={{ color: '#60a5fa' }}>
            <Droplets size={14} /> 水属性
          </span>
        );
      case 'grass':
        return (
          <span className="element-tag" style={{ color: '#4ade80' }}>
            <Leaf size={14} /> 草属性
          </span>
        );
    }
  };

  const renderCard = (
    card: Card,
    options?: { interactive?: boolean; bonus?: number; total?: number }
  ) => {
    const { interactive = false, bonus = 0, total } = options || {};
    return (
      <div
        key={card.id}
        onClick={() => interactive && handleSelectCard(card)}
        className={`card attr-${card.element} ${
          interactive ? (isAnimating ? 'card-disabled' : 'card-interactive') : ''
        }`}
      >
        {bonus > 0 && <div className="bonus-badge">属性有利 +{bonus}!</div>}

        <div className="card-header">{renderElementBadge(card.element)}</div>

        <div className="card-icon-center">
          <Sword
            size={36}
            color={
              card.element === 'fire'
                ? '#ef4444'
                : card.element === 'water'
                ? '#3b82f6'
                : '#22c55e'
            }
          />
          <div className="weapon-name">{card.weaponName}</div>
        </div>

        <div className="card-footer">
          <span className="atk-label">{total !== undefined ? 'TOTAL' : 'ATK'}</span>
          <span className="atk-value">{total !== undefined ? total : card.attack}</span>
        </div>
      </div>
    );
  };

  const isGameOver = playerHp <= 0 || cpuHp <= 0;

  return (
    <div className="game-container">
      {/* ヘッダー */}
      <header className="header">
        <div className="title-group">
          <h1>WEAPON & MAGIC DUEL</h1>
          <div className="rule-badge">属性有利 (+{ELEMENT_BONUS}): 火 ＞ 草 ＞ 水 ＞ 火</div>
        </div>
        <button className="reset-btn" onClick={resetGame}>
          <RotateCcw size={15} /> リセット
        </button>
      </header>

      {/* CPUエリア */}
      <div>
        <div className={`status-bar ${shakeTarget === 'cpu' ? 'shake' : ''}`}>
          <div className="status-top">
            <span>CPU 対戦相手</span>
            <span>
              HP {cpuHp} / {MAX_HP}
            </span>
          </div>
          <div className="hp-bar-bg">
            <div className="hp-bar-fill hp-cpu" style={{ width: `${(cpuHp / MAX_HP) * 100}%` }} />
          </div>
        </div>

        <div className="hand-row">
          {cpuHand.map((c) => (
            <div key={c.id} className="card-back">
              <HelpCircle size={28} />
            </div>
          ))}
        </div>
      </div>

      {/* 中央バトルフィールド */}
      <main className="arena">
        {battle ? (
          <>
            <div className="battle-stage">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                  あなた
                </div>
                {renderCard(battle.playerCard, {
                  bonus: battle.playerBonus,
                  total: battle.playerTotal,
                })}
              </div>

              <div className="vs-badge">VS</div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                  CPU
                </div>
                {renderCard(battle.cpuCard, {
                  bonus: battle.cpuBonus,
                  total: battle.cpuTotal,
                })}
              </div>
            </div>

            <div
              className={`result-banner ${
                battle.outcome === 'win'
                  ? 'result-win'
                  : battle.outcome === 'lose'
                  ? 'result-lose'
                  : 'result-draw'
              }`}
            >
              {battle.outcome === 'win' && `WIN! ${battle.damage} ダメージ！`}
              {battle.outcome === 'lose' && `LOSE... ${battle.damage} ダメージ`}
              {battle.outcome === 'draw' && 'DRAW (引き分け)'}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <Sparkles size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
            <p style={{ fontSize: '0.9rem' }}>下の3枚の手札からカードをタップして出撃！</p>
          </div>
        )}
      </main>

      {/* プレイヤーエリア */}
      <div>
        <div className="hand-row">
          {playerHand.map((card) => renderCard(card, { interactive: true }))}
        </div>

        <div className={`status-bar ${shakeTarget === 'player' ? 'shake' : ''}`}>
          <div className="status-top">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} color="#34d399" /> あなた
            </span>
            <span>
              HP {playerHp} / {MAX_HP}
            </span>
          </div>
          <div className="hp-bar-bg">
            <div
              className="hp-bar-fill hp-player"
              style={{ width: `${(playerHp / MAX_HP) * 100}%` }}
            />
          </div>
        </div>

        <div className="battle-log">{logMessage}</div>
      </div>

      {/* 勝敗決着モーダル */}
      {isGameOver && (
        <div className="gameover-overlay">
          <div className="gameover-box">
            <h2 style={{ color: playerHp > 0 ? '#34d399' : '#f87171' }}>
              {playerHp > 0 ? 'VICTORY!' : 'DEFEAT...'}
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
              {playerHp > 0
                ? '見事CPUのHPを0にしました！'
                : 'HPが0になってしまいました…'}
            </p>
            <button className="play-again-btn" onClick={resetGame}>
              もう一度対戦する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}