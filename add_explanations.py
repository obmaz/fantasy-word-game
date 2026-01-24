#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
게임 데이터 파일에 koreanExplanation과 englishExplanation을 추가하는 스크립트
"""

import re

def parse_object_line(line):
    """객체 라인을 파싱하여 정보 추출"""
    original_line = line
    line_stripped = line.strip()
    
    # { day: X, word: "...", meaning: "..." } 형태 파싱
    day_match = re.search(r'day:\s*(\d+)', line_stripped)
    word_match = re.search(r'word:\s*"([^"]+)"', line_stripped)
    # meaning은 따옴표 안의 모든 내용 (이스케이프된 따옴표 고려)
    meaning_match = re.search(r'meaning:\s*"((?:[^"\\]|\\.)*)"', line_stripped)
    
    if not (day_match and word_match and meaning_match):
        return None
    
    return {
        'day': int(day_match.group(1)),
        'word': word_match.group(1),
        'meaning': meaning_match.group(1),
        'has_korean': 'koreanExplanation' in line_stripped,
        'has_english': 'englishExplanation' in line_stripped,
        'original': original_line.rstrip('\n'),
        'ends_with_comma': line_stripped.rstrip().endswith(',')
    }

def create_updated_line(obj):
    """객체 정보를 기반으로 업데이트된 라인 생성"""
    parts = [
        f'day: {obj["day"]}',
        f'word: "{obj["word"]}"',
        f'meaning: "{obj["meaning"]}"'
    ]
    
    # koreanExplanation 추가
    if obj['has_korean']:
        # 기존 값 추출
        korean_match = re.search(r'koreanExplanation:\s*"([^"]+)"', obj['original'])
        if korean_match:
            parts.append(f'koreanExplanation: "{korean_match.group(1)}"')
        else:
            parts.append(f'koreanExplanation: "{obj["meaning"]}을(를) 의미하는 단어"')
    else:
        parts.append(f'koreanExplanation: "{obj["meaning"]}을(를) 의미하는 단어"')
    
    # englishExplanation 추가
    if obj['has_english']:
        # 기존 값 추출
        english_match = re.search(r'englishExplanation:\s*"([^"]+)"', obj['original'])
        if english_match:
            parts.append(f'englishExplanation: "{english_match.group(1)}"')
        else:
            parts.append(f'englishExplanation: "meaning: {obj["meaning"]}"')
    else:
        parts.append(f'englishExplanation: "meaning: {obj["meaning"]}"')
    
    # 라인 구성 (원본 들여쓰기 유지)
    # 원본에서 앞쪽 공백 추출
    indent_match = re.match(r'^(\s*)', obj['original'])
    indent = indent_match.group(1) if indent_match else '  '
    
    result = indent + '{ ' + ', '.join(parts) + ' }'
    if obj['ends_with_comma']:
        result += ','
    
    return result

def update_file(filepath):
    """파일을 업데이트하여 누락된 설명 추가"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    updated_lines = []
    in_raw_data = False
    processed_count = 0
    added_count = 0
    
    for line_num, line in enumerate(lines, 1):
        # rawData 배열 시작 확인 (rawData_ 또는 rawDataData_ 모두 지원)
        if 'window.rawData' in line and '=' in line:
            in_raw_data = True
            updated_lines.append(line)
            continue
        
        # rawData 배열 끝 확인
        if in_raw_data and line.strip() == '];':
            in_raw_data = False
            updated_lines.append(line)
            continue
        
        # rawData 배열 내부
        if in_raw_data:
            # 객체 라인인지 확인 (공백 무시)
            line_stripped = line.strip()
            if line_stripped.startswith('{') and 'day:' in line_stripped:
                obj = parse_object_line(line)
                if obj:
                    processed_count += 1
                    # 둘 다 있으면 그대로 (하지만 형식 확인)
                    if obj['has_korean'] and obj['has_english']:
                        # 형식이 올바른지 확인
                        if ', koreanExplanation:' in obj['original'] and ', englishExplanation:' in obj['original']:
                            updated_lines.append(line)
                        else:
                            # 형식 수정 필요
                            updated_lines.append(create_updated_line(obj) + '\n')
                    else:
                        # 하나라도 없으면 추가
                        updated_lines.append(create_updated_line(obj) + '\n')
                        if not (obj['has_korean'] and obj['has_english']):
                            added_count += 1
                    continue
            
            updated_lines.append(line)
        else:
            updated_lines.append(line)
    
    # 파일에 쓰기
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)
    
    print(f"✓ Updated {filepath}: Processed {processed_count} items, Added explanations to {added_count} items")

def main():
    files = [
        'src/data/game-data-1.js',
        'src/data/game-data-2.js'
    ]
    
    for filepath in files:
        try:
            update_file(filepath)
        except Exception as e:
            print(f"✗ Error processing {filepath}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    main()
