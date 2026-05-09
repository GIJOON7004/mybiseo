"""Fix type imports in split db modules"""
import os, re

BASE = '/home/ubuntu/mybiseo'
files_to_fix = {
    'server/db/abtest.ts': ['InsertAbExperiment', 'InsertAbVariant', 'InsertAbEvent', 'DiagnosisAutomationConfig'],
    'server/db/ad.ts': ['InsertAiMonitorCompetitor', 'InsertSeasonalCalendar', 'InsertAdminNotification'],
    'server/db/hospital.ts': ['InsertHospitalProfile', 'InsertHospitalInfoItem'],
    'server/db/lead.ts': ['InsertSeoLead'],
}

for filepath, types in files_to_fix.items():
    full = os.path.join(BASE, filepath)
    content = open(full).read()
    
    schema_import = 'import * as schema from "../../drizzle/schema";'
    types_str = ", ".join(types)
    type_import = f'import type {{ {types_str} }} from "../../drizzle/schema";'
    
    if schema_import in content and type_import not in content:
        content = content.replace(schema_import, schema_import + "\n" + type_import)
        open(full, 'w').write(content)
        print(f"Fixed: {filepath} - added {len(types)} type imports")
    else:
        print(f"Skip: {filepath}")

# lead.ts의 calculateLeadPriority는 db.ts에 정의된 private 함수 - 복사 필요
lead_path = os.path.join(BASE, 'server/db/lead.ts')
content = open(lead_path).read()
if 'function calculateLeadPriority' not in content:
    db_content = open(os.path.join(BASE, 'server/db.ts')).read()
    match = re.search(r'(function calculateLeadPriority\([^)]*\)[^{]*\{.*?\n\})', db_content, re.DOTALL)
    if match:
        func_code = match.group(1)
        insert_point = 'import type { InsertSeoLead } from "../../drizzle/schema";'
        if insert_point in content:
            content = content.replace(insert_point, insert_point + "\n\n" + func_code)
            open(lead_path, 'w').write(content)
            print("Fixed: server/db/lead.ts - added calculateLeadPriority function")
        else:
            print("WARNING: insert point not found in lead.ts")
    else:
        print("WARNING: calculateLeadPriority not found in db.ts")
