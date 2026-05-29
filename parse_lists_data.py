import pandas as pd
import json
import os
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

# Source paths
chamados_path = r"C:\Users\02790830\Documents\antigravity\cool-franklin\extracted_files\Lista_Chamados_3CRE_importar_no_Lists.xlsx"
escolas_path = r"C:\Users\02790830\Documents\antigravity\cool-franklin\extracted_files\Lista_Escolas_3CRE_importar_no_Lists.xlsx"
final_excel_path = r"C:\Users\02790830\Documents\antigravity\cool-franklin\extracted_files\Controle_Vivo_Climatizacao_3CRE_GOP_FINAL.xlsx"

# Output directory for the React project
output_dir = r"C:\Users\02790830\Documents\antigravity\cool-franklin\src\data"
os.makedirs(output_dir, exist_ok=True)
json_output_path = os.path.join(output_dir, "db.json")

def format_date(val):
    if pd.isna(val) or val == "":
        return ""
    try:
        return pd.to_datetime(val).strftime('%Y-%m-%dT%H:%M:%S')
    except:
        return str(val)

def clean_value(val):
    if pd.isna(val):
        return ""
    return val

try:
    print("Loading datasets...")
    # 1. Active tickets
    df_ch = pd.read_excel(chamados_path)
    df_ch['Data Original da Solicitação'] = df_ch['Data Original da Solicitação'].apply(format_date)
    
    # 2. Schools lookup
    df_esc = pd.read_excel(escolas_path)
    
    # 3. Rich classrooms/AC counts from final excel CADASTRO_VIVO_3CRE
    df_cad = pd.read_excel(final_excel_path, sheet_name="CADASTRO_VIVO_3CRE")
    
    # 4. Relevant events history
    df_hist = pd.read_excel(final_excel_path, sheet_name="HISTORICO_RELEVANTE")
    df_hist['DATA'] = df_hist['DATA'].apply(format_date)
    
    # 5. Email templates
    df_mod = pd.read_excel(final_excel_path, sheet_name="MODELOS_EMAIL")
    
    # Process email templates
    templates = []
    current_type = None
    current_etapa = None
    current_text = []
    
    mod_raw = df_mod.values.tolist()
    for row in mod_raw:
        val_type = row[1] if len(row) > 1 else None
        val_etapa = row[2] if len(row) > 2 else None
        val_text = row[3] if len(row) > 3 else None
        
        if pd.isna(val_type) and pd.isna(val_etapa) and pd.isna(val_text):
            continue
            
        val_type_str = str(val_type).strip() if not pd.isna(val_type) else ""
        val_etapa_str = str(val_etapa).strip() if not pd.isna(val_etapa) else ""
        val_text_str = str(val_text).strip() if not pd.isna(val_text) else ""
        
        if val_type_str and val_type_str != "TIPO DE COMUNICAÇÃO" and val_type_str != "MODELOS DE E-MAIL POR ETAPA DO POP":
            if current_type:
                templates.append({
                    "tipo": current_type,
                    "etapa": current_etapa,
                    "template": "\n".join(current_text).strip()
                })
            current_type = val_type_str
            current_etapa = val_etapa_str
            current_text = [val_text_str] if val_text_str else []
        elif current_type:
            if val_text_str:
                current_text.append(val_text_str)
                
    if current_type:
        templates.append({
            "tipo": current_type,
            "etapa": current_etapa,
            "template": "\n".join(current_text).strip()
        })
        
    print(f"Parsed {len(templates)} email templates.")

    # Process schools: Merge schools import with inventory counts
    schools_dict = {}
    
    for _, row in df_esc.iterrows():
        name = str(row['Unidade Escolar']).strip()
        desig = str(row['Designação']).strip()
        sici = str(row['SICI']).strip()
        end = clean_value(row['Endereço'])
        bairro = clean_value(row['Bairro'])
        conf = clean_value(row['Confirmado pela Unidade'])
        val_gop = clean_value(row['Validado pela GOP'])
        
        schools_dict[desig] = {
            "unidade_escolar": name,
            "designacao": desig,
            "sici": sici,
            "endereco": end,
            "bairro": bairro,
            "confirmado_pela_unidade": conf,
            "validado_pela_gop": val_gop,
            "qtd_salas_de_aula": 0,
            "aparelhos_em_sala": 0,
            "aparelhos_total": 0,
            "salas_sem_aparelho": 0,
            "necessidade_aparelhos": 0,
            "acao_sugerida": "Solicitar confirmação à unidade"
        }
        
    for _, row in df_cad.iterrows():
        desig = str(row['DESIG']).strip()
        if desig in schools_dict:
            schools_dict[desig]["qtd_salas_de_aula"] = int(row['QTD SALAS DE AULA']) if not pd.isna(row['QTD SALAS DE AULA']) else 0
            schools_dict[desig]["aparelhos_em_sala"] = int(row['APARELHOS EM SALA']) if not pd.isna(row['APARELHOS EM SALA']) else 0
            schools_dict[desig]["aparelhos_total"] = int(row['APARELHOS TOTAL']) if not pd.isna(row['APARELHOS TOTAL']) else 0
            schools_dict[desig]["salas_sem_aparelho"] = int(row['SALAS SEM APARELHO']) if not pd.isna(row['SALAS SEM APARELHO']) else 0
            schools_dict[desig]["necessidade_aparelhos"] = int(row['NECESSIDADE APARELHOS']) if not pd.isna(row['NECESSIDADE APARELHOS']) else 0
            schools_dict[desig]["acao_sugerida"] = clean_value(row['AÇÃO SUGERIDA'])
            
    schools_list = list(schools_dict.values())
    print(f"Processed {len(schools_list)} school records.")

    # Process tickets
    tickets_list = []
    for _, row in df_ch.iterrows():
        ue_name = str(row['Unidade Escolar']).strip()
        desig = ""
        for d, sch in schools_dict.items():
            if sch['unidade_escolar'] == ue_name:
                desig = d
                break
                
        tickets_list.append({
            "id_chamado": str(row['Código do Chamado']).strip(),
            "unidade_escolar": ue_name,
            "designacao": desig,
            "data_solicitacao": clean_value(row['Data Original da Solicitação']),
            "local_demanda": clean_value(row['Local da Demanda']),
            "tipo_demanda": clean_value(row['Tipo de Demanda']),
            "status_atual": clean_value(row['Status Atual']),
            "setor_responsavel": clean_value(row['Setor Responsável Atual']),
            "proxima_providencia": clean_value(row['Próxima Providência']),
            "ultima_movimentacao": clean_value(row['Última Movimentação Relevante']),
            "informacao_validada": clean_value(row['Informação Validada']),
            "prioridade": clean_value(row['Prioridade']),
            "comunicacao_cto": clean_value(row['Comunicação à CTO']),
            "observacoes": clean_value(row['Observações']),
            "resultado_aptidao": clean_value(row['Resultado/Aptidão']),
            "criado_em": clean_value(row['Data Original da Solicitação']) if clean_value(row['Data Original da Solicitação']) else "2026-03-01T08:00:00",
            "modificado_em": "2026-05-27T10:00:00"
        })
        
    print(f"Processed {len(tickets_list)} active tickets.")
    
    for tk in tickets_list:
        tk_events = df_hist[df_hist['ID CHAMADO'] == tk['id_chamado']]
        if not tk_events.empty:
            latest_date = tk_events['DATA'].max()
            if not pd.isna(latest_date) and latest_date != "":
                tk['modificado_em'] = latest_date

    # Process events history
    events_list = []
    for _, row in df_hist.iterrows():
        id_chamado = str(row['ID CHAMADO']).strip() if not pd.isna(row['ID CHAMADO']) else ""
        ue = str(row['UNIDADE ESCOLAR']).strip() if not pd.isna(row['UNIDADE ESCOLAR']) else ""
        
        desig = str(row['DESIGNAÇÃO']).strip() if not pd.isna(row['DESIGNAÇÃO']) else ""
        if (not desig or desig == "nan") and id_chamado:
            for tk in tickets_list:
                if tk['id_chamado'] == id_chamado:
                    desig = tk['designacao']
                    break
        
        events_list.append({
            "id_evento": str(row['ID EVENTO']).strip(),
            "data": clean_value(row['DATA']),
            "id_chamado": id_chamado if id_chamado != "nan" else "",
            "designacao": desig if desig != "nan" else "",
            "unidade_escolar": ue if ue != "nan" else "",
            "marco_relevante": clean_value(row['MARCO RELEVANTE']),
            "setor": clean_value(row['SETOR']),
            "responsavel_registro": clean_value(row['RESPONSÁVEL PELO REGISTRO']),
            "observacao": clean_value(row['OBSERVAÇÃO'])
        })
        
    print(f"Processed {len(events_list)} history events.")

    # Save to db.json
    db = {
        "escolas": schools_list,
        "chamados": tickets_list,
        "historico": events_list,
        "modelos_email": templates
    }
    
    with open(json_output_path, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully compiled all data to {json_output_path}!")
except Exception as e:
    print(f"Error compiling database: {e}")
