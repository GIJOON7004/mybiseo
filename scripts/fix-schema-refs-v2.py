"""
분리된 db/*.ts 파일에서 bare schema 테이블명을 schema.xxx로 변환
"""
import os, re

BASE = "/home/ubuntu/mybiseo"

# drizzle/schema.ts에서 export된 테이블명 목록
schema_exports = []
with open(os.path.join(BASE, "drizzle/schema.ts")) as f:
    for line in f:
        m = re.match(r'^export const (\w+)', line)
        if m:
            schema_exports.append(m.group(1))

# 타입 export도 포함
with open(os.path.join(BASE, "drizzle/schema.ts")) as f:
    for line in f:
        m = re.match(r'^export type (\w+)', line)
        if m:
            schema_exports.append(m.group(1))

print(f"Schema exports: {len(schema_exports)} items")

# 분리된 파일 목록
target_files = [
    "server/db/chat.ts",
    "server/db/lead.ts",
    "server/db/hospital.ts",
    "server/db/ad.ts",
    "server/db/interview.ts",
    "server/db/abtest.ts",
]

for filepath in target_files:
    full_path = os.path.join(BASE, filepath)
    if not os.path.exists(full_path):
        continue
    
    content = open(full_path).read()
    original = content
    
    for name in schema_exports:
        # 단어 경계로 매칭 - schema. 접두사가 없는 bare name만 교체
        # 제외: import 문, 타입 선언, 함수명, 변수 선언
        # 패턴: from/import 뒤가 아닌 곳에서 bare name이 사용될 때
        pattern = r'(?<!schema\.)(?<!\w)(?<!import )(?<!from ")(?<!type )' + re.escape(name) + r'(?=\s*[,\)\]\}]|\s*$|\s*\.|\s*\[)'
        # 더 안전한 접근: 특정 컨텍스트에서만 교체
        # - eq(xxx, ...) 또는 from(xxx) 등 drizzle 쿼리 컨텍스트
        # - .from(xxx), .insert(xxx), .update(xxx), .delete(xxx)
        pass
    
    # 더 간단한 접근: 코드에서 실제 사용 패턴 기반 교체
    # drizzle 쿼리에서 테이블은 .from(table), .insert(table), .update(table), .delete(table) 형태
    # 또는 eq(table.column, value) 형태에서 table.column
    for name in schema_exports:
        # .from(tableName) → .from(schema.tableName)
        content = re.sub(r'\.from\(\s*' + re.escape(name) + r'\s*\)', f'.from(schema.{name})', content)
        # .insert(tableName) → .insert(schema.tableName)
        content = re.sub(r'\.insert\(\s*' + re.escape(name) + r'\s*\)', f'.insert(schema.{name})', content)
        # .update(tableName) → .update(schema.tableName)
        content = re.sub(r'\.update\(\s*' + re.escape(name) + r'\s*\)', f'.update(schema.{name})', content)
        # .delete(tableName) → .delete(schema.tableName)
        content = re.sub(r'\.delete\(\s*' + re.escape(name) + r'\s*\)', f'.delete(schema.{name})', content)
        # tableName.columnName → schema.tableName.columnName (테이블.컬럼 참조)
        content = re.sub(r'(?<!schema\.)(?<!\w)' + re.escape(name) + r'\.(\w+)', f'schema.{name}.\\1', content)
    
    if content != original:
        open(full_path, 'w').write(content)
        changes = sum(1 for a, b in zip(content.split('\n'), original.split('\n')) if a != b)
        print(f"  Fixed: {filepath} ({changes} lines changed)")
    else:
        print(f"  No changes: {filepath}")
