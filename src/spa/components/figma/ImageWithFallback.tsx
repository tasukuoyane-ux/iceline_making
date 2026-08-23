import React, { useState } from 'react'
import { EDIT_MODE } from '../../lib/editable'
import { canOptimize, optUrl, optSrcSet } from '../../../lib/imageOpt'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

// パフォーマンス対応：
//  - 対応ホストの画像は /_next/image（Vercel画像最適化）経由で WebP・縮小配信
//  - 既定で loading="lazy" / decoding="async"（MV 等は呼び出し側で eager を指定）
//  - 編集プレビュー（EDIT_MODE）では素の src で表示する。コンソールが img.src を
//    直接書き換えて下書きを反映するため、srcset があると差し替えが効かなくなる。
//  - 最適化URLの読み込みに失敗したら素の URL で再試行し、それでも失敗したら
//    従来どおりプレースホルダーを表示する。
export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [stage, setStage] = useState<'opt' | 'raw' | 'error'>('opt')

  const { src, alt, style, className, loading, decoding, sizes, ...rest } = props
  const useOpt = stage === 'opt' && !EDIT_MODE && typeof src === 'string' && canOptimize(src)

  if (stage === 'error') {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
        </div>
      </div>
    )
  }

  return (
    <img
      src={useOpt ? optUrl(src as string, 1080) : src}
      srcSet={useOpt ? optSrcSet(src as string) : undefined}
      sizes={useOpt ? (sizes ?? '100vw') : sizes}
      alt={alt}
      className={className}
      style={style}
      loading={loading ?? 'lazy'}
      decoding={decoding ?? 'async'}
      {...rest}
      onError={() => setStage(useOpt ? 'raw' : 'error')}
    />
  )
}
