import { BattleStrategy } from '@/database/entities/evaluation/battle-group.entity';
import { Injectable } from '@nestjs/common';

export interface BattlePair {
  assetAId: string;
  assetBId: string;
}

export interface StrategyValidation {
  isValid: boolean;
  error?: string;
  recommendedBattleCount?: number;
  maxBattleCount?: number;
}

@Injectable()
export class BattleStrategyService {
  validateBattleConfig(strategy: BattleStrategy, assetIds: string[], battleCount?: number): StrategyValidation {
    const assetCount = assetIds.length;

    // 基础校验
    if (assetCount < 2) {
      return { isValid: false, error: 'At least 2 images are required for battles' };
    }

    switch (strategy) {
      case BattleStrategy.ROUND_ROBIN:
        const roundRobinBattles = this.calculateRoundRobinBattles(assetCount);
        return {
          isValid: true,
          recommendedBattleCount: roundRobinBattles,
        };

      case BattleStrategy.RANDOM_PAIRS:
        if (!battleCount || battleCount <= 0) {
          return {
            isValid: false,
            error: 'Battle count must be specified for random pairs strategy',
          };
        }

        const maxPossibleBattles = this.calculateMaxRandomBattles(assetCount);

        if (battleCount > maxPossibleBattles) {
          return {
            isValid: false,
            error: `Too many battles requested. Maximum ${maxPossibleBattles} battles for ${assetCount} images`,
            maxBattleCount: maxPossibleBattles,
          };
        }

        const minRecommended = Math.max(3, assetCount);

        if (battleCount < minRecommended) {
          return {
            isValid: true,
            recommendedBattleCount: minRecommended,
          };
        }

        return { isValid: true };

      default:
        return { isValid: false, error: 'Unsupported battle strategy' };
    }
  }

  /**
   * 生成对战配对
   * @param strategy 对战策略
   * @param assetIds 图片ID列表
   * @param battleCount 对战次数（仅随机配对需要）
   * @returns 对战配对列表
   */
  generateBattlePairs(strategy: BattleStrategy, assetIds: string[], battleCount?: number): BattlePair[] {
    switch (strategy) {
      case BattleStrategy.ROUND_ROBIN:
        return this.generateRoundRobinPairs(assetIds);

      case BattleStrategy.RANDOM_PAIRS:
        if (!battleCount) {
          throw new Error('Battle count is required for random pairs strategy');
        }
        return this.generateRandomPairs(assetIds, battleCount);

      default:
        throw new Error('Unsupported battle strategy');
    }
  }

  /**
   * 生成循环赛配对：每两张图片都对战一次
   * @param assetIds 图片ID列表
   * @returns 对战配对列表
   */
  private generateRoundRobinPairs(assetIds: string[]): BattlePair[] {
    const pairs: BattlePair[] = [];

    for (let i = 0; i < assetIds.length; i++) {
      for (let j = i + 1; j < assetIds.length; j++) {
        pairs.push({
          assetAId: assetIds[i],
          assetBId: assetIds[j],
        });
      }
    }

    return pairs;
  }

  /**
   * 生成随机配对：指定次数的随机组合
   * @param assetIds 图片ID列表
   * @param battleCount 对战次数
   * @returns 对战配对列表
   */
  private generateRandomPairs(assetIds: string[], battleCount: number): BattlePair[] {
    const pairs: BattlePair[] = [];
    const usedPairs = new Set<string>();

    // 确保每张图片至少参与一次对战
    const shuffledAssets = [...assetIds].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledAssets.length - 1; i += 2) {
      if (pairs.length >= battleCount) break;

      const pairKey = this.createPairKey(shuffledAssets[i], shuffledAssets[i + 1]);
      if (!usedPairs.has(pairKey)) {
        pairs.push({
          assetAId: shuffledAssets[i],
          assetBId: shuffledAssets[i + 1],
        });
        usedPairs.add(pairKey);
      }
    }

    // 生成剩余的随机配对
    while (pairs.length < battleCount) {
      const assetA = assetIds[Math.floor(Math.random() * assetIds.length)];
      const assetB = assetIds[Math.floor(Math.random() * assetIds.length)];

      if (assetA === assetB) continue;

      const pairKey = this.createPairKey(assetA, assetB);
      if (!usedPairs.has(pairKey)) {
        pairs.push({ assetAId: assetA, assetBId: assetB });
        usedPairs.add(pairKey);
      }
    }

    return pairs;
  }

  /**
   * 计算循环赛的对战数量
   * @param assetCount 图片数量
   * @returns 对战数量
   */
  private calculateRoundRobinBattles(assetCount: number): number {
    return Math.floor((assetCount * (assetCount - 1)) / 2);
  }

  /**
   * 计算随机配对的最大对战数量
   * @param assetCount 图片数量
   * @returns 最大对战数量
   */
  private calculateMaxRandomBattles(assetCount: number): number {
    // 理论最大值：C(n,2) = n*(n-1)/2
    // 实际建议最大值：每张图片最多参与图片总数的2倍对战
    const theoreticalMax = this.calculateRoundRobinBattles(assetCount);
    const practicalMax = assetCount * assetCount * 2;

    return Math.min(theoreticalMax * 3, practicalMax); // 允许一定程度的重复对战
  }

  /**
   * 创建配对的唯一标识
   * @param assetA 图片A ID
   * @param assetB 图片B ID
   * @returns 配对标识
   */
  private createPairKey(assetA: string, assetB: string): string {
    // 确保相同的两张图片无论顺序如何都生成相同的key
    return [assetA, assetB].sort().join('|');
  }
}
