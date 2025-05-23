import React, { CSSProperties, useContext, useState } from 'react';

import useSWR from 'swr';

import { useCreation, useLatest, useMemoizedFn, useThrottleEffect } from 'ahooks';
import { imageDimensionsFromStream } from 'image-dimensions';
import { isEmpty, isString, isUndefined } from 'lodash';

import { LayerScaleContext } from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction';
import { TCalculateRelativePositionParams } from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction/utils.ts';

export type TLayerValueTypeOption = {
  number?: TCalculateRelativePositionParams;
};

type LayerOmitConfig = 'mapper' | 'type' | 'insertMapper' | 'valueTypeOptions';

export interface ILayer {
  type: 'layer' | 'interaction'; // 叠层 / 交互层

  width?: number | null;
  height?: number | null;

  scale?: number; // Zoom 缩放

  translateX?: number; // Horizontal 水平偏移
  translateY?: number; // Vertical 垂直偏移

  rotateX?: number; // Tilt 倾斜
  rotateY?: number; // Pan 平移
  rotateZ?: number; // Roll 滚动

  padding?: number; // Padding 内边距

  opacity?: number; // Transparency 透明度
  borderColor?: string; // Border Color 边框颜色
  background?: string; // Background 背景

  image?: string; // Image 图片
  icon?: string; // Icon 图标

  mapper?: Record<string, (keyof Omit<ILayer, LayerOmitConfig>)[]>; // Layer Mapper
  insertMapper?: Partial<Record<PropertyKey & keyof Omit<ILayer, LayerOmitConfig>, string[]>>; // Interaction Mapper

  valueTypeOptions?: Record<string, TLayerValueTypeOption>;
}

type LayerMapperValue = keyof Omit<ILayer, LayerOmitConfig>;

export type VLayer = {
  padding: number; // 画布内边距（用于自动计算中心图像宽高）
  background?: string; // 画布背景颜色
  height?: number; // 画布高度
  layers: ILayer[];
};

export enum ELayerDefault {
  borderColor = 'transparent',
}

export interface IUseLayerOptions {
  maxWidth: number;
  maxHeight: number;
  layer: ILayer;
  values: Record<string, string | number | boolean | string[] | number[] | boolean[] | undefined>;
  style?: CSSProperties;
  setLayerScale?: React.Dispatch<React.SetStateAction<number>>;
}

const createObjectWithLayerMapper = (
  values: IUseLayerOptions['values'],
  layerMapper: [string, LayerMapperValue[]][],
  keys: LayerMapperValue[],
  extra: Record<string, any> = {},
  wrapper?: (...args: any[]) => any,
) => {
  const foundValues = keys.reduce(
    (acc, key) => {
      const foundKey = layerMapper.find(([_, value]) => value.includes(key))?.[0];
      if (foundKey) {
        acc[key] = values[foundKey];
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  if (Object.keys(foundValues).length === 0) {
    return {};
  }

  const processedValues = wrapper ? wrapper(foundValues) : foundValues;

  return {
    ...extra,
    ...processedValues,
  };
};

export const useLayer = ({ layer, style, values, maxWidth, maxHeight, setLayerScale }: IUseLayerOptions) => {
  const layerMapper = useCreation(() => (layer.mapper ? Object.entries(layer.mapper) : null), [layer.mapper]);

  const layerStyle = useCreation(() => {
    if (layerMapper) {
      const resultStyle: CSSProperties = {
        ...createObjectWithLayerMapper(values, layerMapper, ['width', 'height'], {}, ({ width, height }) => {
          const scale = Math.min(width ? maxWidth / width : 1, height ? maxHeight / height : 1);

          if (scale !== 1) {
            setLayerScale?.(scale);
          }

          return {
            width: width ? width * scale : maxWidth,
            height: height ? height * scale : maxHeight,
          };
        }),
        ...createObjectWithLayerMapper(
          values,
          layerMapper,
          ['background'],
          {
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          },
          ({ background, ...rest }) => ({
            ...rest,
            background: background?.startsWith('http') ? `url(${background})` : background,
          }),
        ),
        ...createObjectWithLayerMapper(values, layerMapper, ['scale'], void 0, ({ scale }) => ({
          transform: `scale(${scale})`,
        })),
      };

      if (!isEmpty(resultStyle)) {
        return {
          ...style,
          ...resultStyle,
        };
      }
    }

    return style;
  }, [layerMapper, maxWidth, maxHeight, values, style]);

  const layerValues = useCreation(() => {
    if (!layerMapper) {
      return {};
    }

    // return createObjectWithLayerMapper(values, layerMapper, ['image', 'icon', 'translateX', 'translateY']);
    const finalValues = {};
    for (const [key, layerOptions] of layerMapper) {
      const val = values[key];
      if (!isUndefined(val)) {
        for (const option of layerOptions) {
          finalValues[option] = {
            value: val,
            targets: finalValues[option]?.targets ? [...finalValues[option].targets, key] : [key],
          };
        }
      }
    }

    return finalValues as Partial<
      Record<
        PropertyKey & LayerMapperValue,
        {
          value: string | number | boolean | string[] | number[] | boolean[];
          targets: string[];
        }
      >
    >;
  }, [layerMapper, values]);

  const layerScale = useContext(LayerScaleContext);

  const [autoStyle, setAutoStyle] = useState<CSSProperties>({});

  const { data: cache, mutate: setCache } = useSWR<Record<string, any>>('vines-use-layer-cache', null, {
    fallbackData: {},
  });
  const latestCache = useLatest(cache);
  const handleCalculateAutoStyle = useMemoizedFn(async () => {
    let resultStyle: CSSProperties = {};

    // 自动计算图片尺寸
    const layerWidth = layer.width;
    const layerHeight = layer.height;
    const layerImageValue = layerValues?.image?.value;
    if ((layerWidth === null || layerHeight === null) && isString(layerImageValue)) {
      const cacheId = `auto-calc-size-${layerImageValue}`;
      if (latestCache.current?.[cacheId]) {
        // 使用缓存
        const size = latestCache.current[cacheId];
        if (size) {
          resultStyle = {
            ...resultStyle,
            ...(layerWidth === null ? { width: size.width * layerScale } : {}),
            ...(layerHeight === null ? { height: size.height * layerScale } : {}),
          };
        }
      } else {
        // region 自动计算图片尺寸
        const { body } = await fetch(layerImageValue);
        if (body) {
          let size: { width: number; height: number } | undefined;
          try {
            size = await imageDimensionsFromStream(body);
          } catch {
            await new Promise((resolve) => {
              const img = new Image();
              img.src = layerImageValue;
              const isTimeout = setTimeout(() => resolve(null), 30000);
              img.onload = () => {
                clearTimeout(isTimeout);
                size = { width: img.width, height: img.height };
                resolve(null);
              };
            });
          }
          if (size) {
            resultStyle = {
              ...resultStyle,
              ...(layerWidth === null ? { width: size.width * layerScale } : {}),
              ...(layerHeight === null ? { height: size.height * layerScale } : {}),
            };
            await setCache((prev) => ({
              ...prev,
              [cacheId]: size,
            }));
          }
        }
        // endregion
      }
    }

    setAutoStyle((prev) => ({
      ...prev,
      ...resultStyle,
    }));
  });
  useThrottleEffect(
    () => {
      void handleCalculateAutoStyle();
    },
    [layer, layerScale, layerValues],
    { wait: 500 },
  );

  return {
    layerMapper,
    layerStyle: {
      ...layerStyle,
      ...autoStyle,
    },
    layerValues,
  };
};
