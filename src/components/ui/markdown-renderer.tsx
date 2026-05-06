import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

type BlockType = 'paragraph' | 'code-block' | 'ul' | 'ol'

interface Block {
  type: BlockType
  content: string[]
  language?: string
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const blocks = useMemo(() => parseBlocks(content), [content])

  return (
    <div
      className={cn(
        'text-sm leading-relaxed space-y-2 break-words max-w-full',
        className,
      )}
    >
      {blocks.map((block, index) => (
        <React.Fragment key={index}>{renderBlock(block)}</React.Fragment>
      ))}
    </div>
  )
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let currentBlock: Block | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Handle Code Blocks
    if (line.trim().startsWith('```')) {
      if (currentBlock?.type === 'code-block') {
        blocks.push(currentBlock)
        currentBlock = null
      } else {
        if (currentBlock) blocks.push(currentBlock)
        const language = line.trim().slice(3)
        currentBlock = { type: 'code-block', content: [], language }
      }
      continue
    }

    if (currentBlock?.type === 'code-block') {
      currentBlock.content.push(line)
      continue
    }

    // Handle Lists
    const isUl = line.trim().match(/^[-*]\s/)
    const isOl = line.trim().match(/^\d+\.\s/)

    if (isUl || isOl) {
      const type = isUl ? 'ul' : 'ol'
      if (currentBlock?.type === type) {
        currentBlock.content.push(line)
      } else {
        if (currentBlock) blocks.push(currentBlock)
        currentBlock = { type, content: [line] }
      }
      continue
    }

    // Handle Empty Lines
    if (line.trim() === '') {
      if (currentBlock) {
        blocks.push(currentBlock)
        currentBlock = null
      }
      continue
    }

    // Handle Paragraphs
    if (currentBlock?.type === 'paragraph') {
      currentBlock.content.push(line)
    } else {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'paragraph', content: [line] }
    }
  }

  if (currentBlock) blocks.push(currentBlock)

  return blocks
}

function renderBlock(block: Block) {
  switch (block.type) {
    case 'code-block':
      return (
        <pre className="bg-slate-950 text-slate-50 p-3 rounded-md overflow-x-auto my-2 text-xs font-mono max-w-full">
          <code>{block.content.join('\n')}</code>
        </pre>
      )
    case 'ul':
      return (
        <ul className="list-disc pl-5 space-y-1 my-2 marker:text-gray-400">
          {block.content.map((line, i) => (
            <li key={i}>{parseInline(line.replace(/^[-*]\s/, ''))}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="list-decimal pl-5 space-y-1 my-2 marker:text-gray-400">
          {block.content.map((line, i) => (
            <li key={i}>{parseInline(line.replace(/^\d+\.\s/, ''))}</li>
          ))}
        </ol>
      )
    case 'paragraph':
      return (
        <p className="mb-2 last:mb-0">
          {block.content.map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {parseInline(line)}
            </React.Fragment>
          ))}
        </p>
      )
    default:
      return null
  }
}

function parseInline(text: string): React.ReactNode {
  let nodes: React.ReactNode[] = [text]

  const applyRegex = (
    regex: RegExp,
    transform: (match: string, key: string) => React.ReactNode,
  ) => {
    const result: React.ReactNode[] = []
    let keyCounter = 0
    const testRegex = new RegExp(regex.source, regex.flags.replace('g', ''))

    nodes.forEach((node) => {
      if (typeof node !== 'string') {
        result.push(node)
        return
      }

      const parts = node.split(regex)
      parts.forEach((part) => {
        if (testRegex.test(part)) {
          result.push(transform(part, `match-${keyCounter++}`))
        } else if (part !== '') {
          result.push(part)
        }
      })
    })
    nodes = result
  }

  // 1. Inline Code
  applyRegex(/(`[^`]+`)/g, (match, key) => (
    <code
      key={key}
      className="bg-black/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-primary font-medium"
    >
      {match.slice(1, -1)}
    </code>
  ))

  // 2. Links
  applyRegex(/(\[[^\]]+\]\([^)]+\))/g, (match, key) => {
    const linkMatch = match.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (!linkMatch) return match
    return (
      <a
        key={key}
        href={linkMatch[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline font-medium break-all"
      >
        {linkMatch[1]}
      </a>
    )
  })

  // 3. Bold
  applyRegex(/(\*\*.*?\*\*)/g, (match, key) => (
    <strong key={key} className="font-bold text-inherit">
      {match.slice(2, -2)}
    </strong>
  ))

  // 4. Italic
  applyRegex(/(\*.*?\*)/g, (match, key) => (
    <em key={key} className="italic text-inherit opacity-90">
      {match.slice(1, -1)}
    </em>
  ))

  return <>{nodes}</>
}
