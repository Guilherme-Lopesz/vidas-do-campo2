/* ===== VIDAS DO CAMPO - PRO - script.js ===== */

/* ───────────────────────────────────────
   ESTADO GLOBAL
─────────────────────────────────────── */
const G = {
    farm: '', species: 'Bovinos', audience: 'leigo',
    money: 0, score: 0, hearts: 5, survival: 100,
    stationIdx: 0, questionIdx: 0, streak: 0,
    currentQ: null, answered: false, hintStep: 0,
    stationHits: 0, stationTags: new Set(), dotHistory: [],
    stats: {
        hitsByTag: {},
        missesByTag: {},
        hypothermiaSaved: 0,
        colostrumFails: 0
    },
    timerRef: null, globalStartTime: null, globalTotalSeconds: 0,
    muted: false, prevScreen: 'screen-splash',
    mgIodoDone: false, mgColostroDone: false, mgHipoDone: false, mgDietaDone: false,
    mgFeedingDone: false
};

const HINT_COST = 25;
let questionTimerRef = null;

/* ───────────────────────────────────────
   MOTOR NARRATIVO (Personagens e Rotina)
─────────────────────────────────────── */
const STATIONS = [
    { id: 1, time: 'Dia 1 - 05:30', character: '👨‍🌾 Sr. João', role: 'Produtor (40 anos de campo)', emoji: '📞', title: 'Chamado de Emergência', narrative: 'Doutor, desculpa a hora. Uma fêmea nossa começou a parir de madrugada, mas está exausta e não consegue levantar. O filhote está no pasto.' },
    { id: 2, time: 'Dia 1 - 06:15', character: '👩‍🌾 Dona Maria', role: 'Gerente da Maternidade', emoji: '🍼', title: 'A Corrida Contra o Tempo', narrative: 'O filhote nasceu, mas está fraco. O cronômetro do intestino dele já está correndo e precisamos agir rápido antes que as bactérias ataquem.' },
    { id: 3, time: 'Dia 1 - 10:40', character: '🌧️ Clima: Frente Fria', role: 'Queda brusca de temperatura', emoji: '❄️', title: 'Choque Térmico', narrative: 'A temperatura despencou na fazenda. Encontramos um filhote tremendo muito no canto da baia. Ele está com as orelhas geladas.' },
    { id: 4, time: 'Dia 1 - 14:00', character: '👨‍⚕️ Dr. Carlos', role: 'Veterinário Mentor', emoji: '🦠', title: 'Prevenção de Infecções', narrative: 'A baia de parto esconde inimigos invisíveis. Precisamos blindar a porta de entrada para o coração e fígado dos neonatos imediatamente.' },
    { id: 5, time: 'Dia 2 - 07:00', character: '👨‍🌾 Sr. João', role: 'Produtor Tradicional', emoji: '🌿', title: 'Pico de Exigência', narrative: 'A mãe está aumentando muito a produção de leite, mas parou de comer e está com um hálito estranho (odor de maçã esmagada). Se errarmos a dieta agora, vamos perdê-la.' },
    { id: 6, time: 'Dia 2 - 15:30', character: '👩‍🌾 Dona Maria', role: 'Gerente da Maternidade', emoji: '💉', title: 'Blindagem do Rebanho', narrative: 'Tivemos dois casos de morte súbita no lote vizinho. Precisamos revisar nosso protocolo vacinal para não colocar os recém-nascidos em risco.' },
    { id: 7, time: 'Dia 3 - 09:00', character: '📊 Reunião de Fechamento', role: 'Escritório da Fazenda', emoji: '📈', title: 'Decisões Baseadas em Dados', narrative: 'A crise passou. É hora de sentar com os donos, abrir as planilhas, calcular os prejuízos que tivemos e planejar a prevenção do próximo ciclo.' }
];

/* ───────────────────────────────────────
   BANCO DE QUESTÕES RICO E MODULAR 
─────────────────────────────────────── */
const CAMPUS_LIVES_QUIZ_DATABASE = [
    // --- ESTAÇÃO 1: GESTAÇÃO E PRÉ-PARTO ---
    {
        "id": 10101,
        "station": 1,
        "species": "all",
        "audience": "leigo",
        "difficulty": 1,
        "type": "conceitual",
        "tags": ["gestacao", "tempo", "biologia"],
        "question": "🐄 Qual é o período médio de gestação de uma vaca e de uma ovelha, respectivamente?",
        "options": [
            "Cerca de 9 meses e meio para a vaca e 5 meses para a ovelha.",
            "Cerca de 6 meses para a vaca e 9 meses para a ovelha.",
            "Cerca de 12 meses para a vaca e 3 meses para a ovelha.",
            "Cerca de 5 meses para a vaca e 5 meses para a ovelha."
        ],
        "correct": 0,
        "hint": "A gestação bovina dura aproximadamente o mesmo que a humana, enquanto a ovina é bem mais curta.",
        "explanation": "A resposta correta é a primeira alternativa. Em média, a gestação das vacas dura cerca de 280 a 285 dias, enquanto a das ovelhas dura aproximadamente 145 a 152 dias. As demais alternativas apresentam períodos incompatíveis com a fisiologia dessas espécies. Conhecer essas médias permite planejar o manejo pré-parto, preparar a maternidade e acompanhar possíveis atrasos ou antecipações.",
        "funFact": "Raça, sexo do feto e número de filhotes podem influenciar discretamente a duração da gestação."
    },

    {
        "id": 10102,
        "station": 1,
        "species": "all",
        "audience": "leigo",
        "difficulty": 2,
        "type": "prevencao",
        "tags": ["ecc", "nutricao", "parto"],
        "question": "Por que é importante que vacas e ovelhas cheguem ao parto com boa condição corporal, sem estarem muito magras ou muito gordas?",
        "options": [
            "Porque o peso da mãe não interfere no parto nem na saúde do filhote.",
            "Porque tanto o excesso quanto a falta de reservas corporais aumentam o risco de problemas no parto e no pós-parto.",
            "Porque animais muito magros sempre produzem mais leite.",
            "Porque animais muito gordos raramente apresentam complicações."
        ],
        "correct": 1,
        "hint": "O melhor resultado costuma estar no equilíbrio, e não nos extremos.",
        "explanation": "A alternativa correta é a segunda. Animais excessivamente magros podem ter poucas reservas para enfrentar o parto e o início da lactação, enquanto animais muito gordos apresentam maior risco de distocia e doenças metabólicas. As demais alternativas ignoram esses riscos conhecidos ou apresentam afirmações incorretas. Manter uma condição corporal adequada melhora a saúde da mãe e aumenta as chances de um nascimento bem-sucedido.",
        "funFact": "Veterinários utilizam uma ferramenta chamada Escore de Condição Corporal (ECC) para estimar as reservas de gordura dos animais."
    },

    {
        "id": 10103,
        "station": 1,
        "species": "Ovinos",
        "audience": "leigo",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["toxemia", "gestacao", "ovinos"],
        "question": "Uma ovelha muito magra, gestando gêmeos, começou a andar sem rumo, se afastou do rebanho e parece desorientada poucos dias antes do parto. Qual é a suspeita mais provável?",
        "options": [
            "Ela apenas está procurando um local tranquilo para parir.",
            "Ela pode estar desenvolvendo Toxemia da Prenhez por falta de energia.",
            "Esse comportamento é normal em todas as ovelhas prenhes.",
            "Ela provavelmente ingeriu água em excesso."
        ],
        "correct": 1,
        "hint": "No final da gestação, gestações gemelares aumentam muito a necessidade energética da mãe.",
        "explanation": "A alternativa correta é a segunda. A Toxemia da Prenhez ocorre quando a demanda energética supera a capacidade de ingestão da ovelha, levando ao comprometimento do metabolismo e ao aparecimento de sinais neurológicos. Procurar um local isolado pode ocorrer próximo ao parto, mas não explica alterações neurológicas importantes. Água em excesso ou comportamento normal não justificam esse quadro. O reconhecimento precoce aumenta as chances de sucesso do tratamento.",
        "funFact": "Ovelhas gestando dois ou mais cordeiros apresentam maior risco de desenvolver essa doença metabólica."
    },

    {
        "id": 10104,
        "station": 1,
        "species": "Bovinos",
        "audience": "leigo",
        "difficulty": 1,
        "type": "prevencao",
        "tags": ["maternidade", "manejo", "biosseguranca"],
        "question": "🐄 Qual é o melhor local para uma vaca dar à luz em uma propriedade rural?",
        "options": [
            "Uma área limpa, seca, com boa drenagem, água disponível e pouca movimentação de animais.",
            "O curral de manejo onde circula todo o rebanho diariamente.",
            "Uma área com lama e acúmulo de fezes para manter o ambiente úmido.",
            "Qualquer local é adequado, desde que exista sombra."
        ],
        "correct": 0,
        "hint": "O recém-nascido entra imediatamente em contato com o ambiente onde nasce.",
        "explanation": "A alternativa correta é a primeira. Ambientes limpos e secos reduzem a exposição do recém-nascido a microrganismos presentes na lama e nas fezes. As demais opções aumentam o risco de infecções neonatais ou não oferecem condições adequadas para mãe e cria. Um bom manejo da maternidade é uma das principais medidas preventivas da propriedade.",
        "funFact": "Situações de estresse intenso podem aumentar a liberação de adrenalina e dificultar a progressão normal do parto."
    },

    {
        "id": 10201,
        "station": 1,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 1,
        "type": "interpretacao",
        "tags": ["ecc", "preparto"],
        "question": "Em vacas leiteiras Holandesas no pré-parto, qual faixa de Escore de Condição Corporal (ECC) é geralmente considerada mais adequada na escala de 1 a 5?",
        "options": [
            "1,5 a 2,0",
            "3,0 a 3,25",
            "4,0 a 4,5",
            "Não existe qualquer referência para essa avaliação."
        ],
        "correct": 1,
        "hint": "O objetivo é equilibrar reservas corporais sem favorecer excesso de mobilização lipídica no pós-parto.",
        "explanation": "A alternativa correta é a segunda. Em vacas leiteiras, um ECC próximo de 3,0 a 3,25 no parto está associado a melhores resultados produtivos e sanitários. Valores muito baixos indicam reservas insuficientes, enquanto valores elevados aumentam o risco de doenças metabólicas. A inexistência de referência é incorreta, pois o ECC é amplamente utilizado na prática clínica e zootécnica.",
        "funFact": "Pequenas diferenças no ECC ao parto podem impactar fertilidade, produção de leite e incidência de doenças metabólicas."
    },

    {
        "id": 10202,
        "station": 1,
        "species": "Ovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "fisiopatologia",
        "tags": ["toxemia", "metabolismo"],
        "question": "Qual alteração fisiopatológica explica os sinais neurológicos observados na Toxemia da Prenhez em ovelhas?",
        "options": [
            "Hipocalcemia isolada causada pela mineralização fetal.",
            "Hipoglicemia associada ao aumento da produção de corpos cetônicos.",
            "Hipertensão portal causada pela compressão uterina.",
            "Insuficiência renal aguda secundária à gestação."
        ],
        "correct": 1,
        "hint": "Considere qual substrato energético é essencial para o funcionamento do sistema nervoso central.",
        "explanation": "A alternativa correta é a segunda. A elevada demanda energética dos fetos pode levar à intensa mobilização de gordura corporal, favorecendo hipoglicemia e aumento de corpos cetônicos, responsáveis pelos sinais clínicos observados. As demais alternativas não representam o principal mecanismo fisiopatológico da doença.",
        "funFact": "Em ovinos, gestações múltiplas aumentam significativamente a necessidade energética no terço final da gestação."
    },

    {
        "id": 10203,
        "station": 1,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["hipocalcemia", "dcad", "minerais"],
        "question": "Ao avaliar um rebanho com alta incidência de hipocalcemia clínica, observa-se dieta pré-parto rica em potássio. Qual mecanismo fisiológico melhor explica esse problema?",
        "options": [
            "O potássio impede diretamente a absorção intestinal de cálcio por competição química.",
            "Dietas altamente catiônicas favorecem alcalose metabólica e reduzem a resposta dos tecidos ao PTH.",
            "O excesso de potássio destrói as glândulas paratireoides.",
            "O potássio impede completamente a produção de vitamina D."
        ],
        "correct": 1,
        "hint": "Pense na relação entre balanço cátion-anião da dieta e homeostase do cálcio.",
        "explanation": "A alternativa correta é a segunda. Dietas com elevado balanço catiônico podem induzir alcalose metabólica, reduzindo a eficiência da resposta dos tecidos ao paratormônio e prejudicando a mobilização de cálcio no momento do parto. A alcalose altera a configuração dos receptores teciduais para o PTH, impedindo que o organismo mobilize eficientemente o cálcio dos ossos para o sangue. As demais alternativas apresentam mecanismos fisiológicos incorretos.",
        "funFact": "O uso estratégico de dietas aniônicas no pré-parto é uma ferramenta amplamente empregada para reduzir a incidência de hipocalcemia em vacas leiteiras."
    },

    {
        "id": 10301,
        "station": 1,
        "species": "Bovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["hipocalcemia", "cetose", "terapeutica"],
        "question": "CASO CLÍNICO: Uma vaca Jersey no final da gestação, ECC 4,25, encontra-se em decúbito esternal, apática e com tremores musculares. O proprietário aplicou cálcio por via subcutânea sem melhora. Qual deve ser a prioridade inicial do médico-veterinário?",
        "options": [
            "Realizar cesariana imediata antes de qualquer estabilização clínica.",
            "Estabilizar a paciente, avaliar doenças metabólicas concomitantes e instituir terapia intravenosa apropriada sob monitoramento.",
            "Administrar apenas ocitocina para estimular o parto.",
            "Liberar o animal para observação por 24 horas antes de qualquer intervenção."
        ],
        "correct": 1,
        "hint": "Em vacas obesas próximas ao parto, mais de um distúrbio metabólico pode ocorrer simultaneamente.",
        "explanation": "A alternativa correta é a segunda. A estabilização clínica deve preceder decisões obstétricas, considerando a possibilidade de hipocalcemia e cetose concomitantes. Cesariana imediata ou simples observação podem atrasar o tratamento adequado, enquanto a ocitocina não corrige a causa metabólica do quadro.",
        "funFact": "A raça Jersey apresenta maior predisposição à hipocalcemia clínica quando comparada a diversas outras raças leiteiras."
    },

    {
        "id": 10302,
        "station": 1,
        "species": "Ovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["toxoplasmose", "aborto", "biosseguranca"],
        "question": "Um rebanho ovino apresenta surtos de aborto no terço final da gestação e placentas com áreas esbranquiçadas de necrose nos cotilédones. Considerando a epidemiologia da doença, qual é a hipótese mais provável e a principal medida preventiva?",
        "options": [
            "Brucelose ovina; vacinação imediata com RB51.",
            "Toxoplasmose; impedir o acesso de felinos às fontes de alimento e descartar adequadamente fetos e placentas.",
            "Leptospirose; tratamento coletivo com metronidazol.",
            "Deficiência mineral; suplementação injetável como medida única."
        ],
        "correct": 1,
        "hint": "Lembre-se de qual espécie atua como hospedeiro definitivo desse protozoário.",
        "explanation": "A alternativa correta é a segunda. A toxoplasmose está associada à contaminação ambiental por oocistos eliminados por felinos, tornando essencial impedir seu acesso às áreas de alimentação e realizar manejo seguro dos materiais abortados. As demais alternativas não correspondem ao agente ou apresentam medidas inadequadas para esse cenário.",
        "funFact": "Felinos eliminam oocistos principalmente após a infecção inicial, motivo pelo qual o controle do acesso de gatos jovens aos depósitos de ração é especialmente importante."
    },

    // --- ESTAÇÃO 2: COLOSTRO ---
    {
        "id": 20101,
        "station": 2,
        "species": "all",
        "audience": "leigo",
        "difficulty": 1,
        "type": "conceitual",
        "tags": ["colostro", "imunidade", "neonato"],
        "question": "🍼 O que é o colostro e por que ele é tão importante para um filhote recém-nascido?",
        "options": [
            "É o primeiro leite produzido pela mãe e fornece energia e anticorpos essenciais para proteger o filhote.",
            "É um leite fraco usado apenas para hidratar o recém-nascido.",
            "É uma secreção que deve ser descartada antes da primeira mamada.",
            "É um substituto artificial utilizado apenas quando falta leite."
        ],
        "correct": 0,
        "hint": "Pense na principal fonte de proteção contra doenças que o filhote recebe logo após nascer.",
        "explanation": "A resposta correta é a primeira alternativa. O colostro é rico em energia, nutrientes e imunoglobulinas que ajudam a proteger o recém-nascido contra infecções enquanto seu próprio sistema imunológico ainda está em desenvolvimento. As demais alternativas apresentam conceitos incorretos sobre sua função e importância.",
        "funFact": "Em bovinos e ovinos, praticamente toda a proteção inicial contra doenças depende da ingestão adequada do colostro."
    },

    {
        "id": 20102,
        "station": 2,
        "species": "Bovinos",
        "audience": "leigo",
        "difficulty": 2,
        "type": "aplicacao",
        "tags": ["tempo", "colostragem", "bezerro"],
        "question": "Qual é o momento mais indicado para um bezerro receber a primeira mamada de colostro?",
        "options": [
            "Preferencialmente nas primeiras duas horas após o nascimento.",
            "Somente depois de completar 24 horas de vida.",
            "Em qualquer momento durante a primeira semana.",
            "Apenas quando começar a andar sozinho."
        ],
        "correct": 0,
        "hint": "A capacidade do intestino de absorver anticorpos diminui rapidamente após o nascimento.",
        "explanation": "A alternativa correta é a primeira. Quanto mais cedo o bezerro recebe colostro de boa qualidade, maior é a absorção de anticorpos. Após as primeiras horas de vida essa capacidade diminui progressivamente, tornando a transferência de imunidade menos eficiente.",
        "funFact": "O processo conhecido como 'fechamento intestinal' reduz drasticamente a absorção de imunoglobulinas nas primeiras 24 horas de vida."
    },

    {
        "id": 20103,
        "station": 2,
        "species": "all",
        "audience": "leigo",
        "difficulty": 3,
        "type": "manejo",
        "tags": ["banco_colostro", "emergencia"],
        "question": "Se a mãe morrer no parto ou não produzir colostro suficiente, qual é a melhor alternativa para proteger o recém-nascido?",
        "options": [
            "Oferecer leite comum adoçado.",
            "Utilizar colostro previamente armazenado de uma fêmea saudável.",
            "Dar apenas água morna até o dia seguinte.",
            "Esperar alguns dias para iniciar a alimentação."
        ],
        "correct": 1,
        "hint": "O substituto ideal deve fornecer também os anticorpos presentes no primeiro leite.",
        "explanation": "A resposta correta é utilizar colostro armazenado adequadamente em um banco de colostro. Leite comum fornece nutrientes, mas não oferece a mesma concentração de imunoglobulinas necessárias para proteger o neonato. Esperar ou fornecer apenas água aumenta o risco de doenças e mortalidade.",
        "funFact": "Quando armazenado corretamente em congelamento, o colostro pode permanecer viável por muitos meses."
    },

    {
        "id": 20201,
        "station": 2,
        "species": "all",
        "audience": "estudante",
        "difficulty": 1,
        "type": "imunologia",
        "tags": ["placenta", "igg", "ruminantes"],
        "question": "Por que bezerros e cordeiros dependem da ingestão de colostro para adquirir imunoglobulinas maternas?",
        "options": [
            "Porque a placenta dos ruminantes praticamente impede a transferência de imunoglobulinas durante a gestação.",
            "Porque os anticorpos fetais são destruídos imediatamente antes do parto.",
            "Porque os linfócitos só começam a funcionar após a primeira mamada.",
            "Porque o colostro ativa anticorpos produzidos pelo fígado fetal."
        ],
        "correct": 0,
        "hint": "Considere as características anatômicas da placenta dos ruminantes.",
        "explanation": "A placenta sinepiteliocorial dos ruminantes impede a passagem significativa de imunoglobulinas para o feto, fazendo com que o recém-nascido dependa da absorção das imunoglobulinas presentes no colostro. As demais alternativas não representam o mecanismo fisiológico correto.",
        "funFact": "Nos seres humanos, a maior parte da imunidade passiva é adquirida ainda durante a gestação por transferência placentária."
    },

    {
        "id": 20202,
        "station": 2,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "interpretacao",
        "tags": ["brix", "qualidade", "colostro"],
        "question": "Ao utilizar um refratômetro de Brix para avaliar colostro bovino, qual valor geralmente indica um colostro de alta qualidade?",
        "options": [
            "Menor que 18%.",
            "Entre 19% e 21%.",
            "Igual ou superior a 22%.",
            "O refratômetro de Brix não pode ser utilizado para essa finalidade."
        ],
        "correct": 2,
        "hint": "Valores mais elevados indicam maior concentração de sólidos totais e costumam estar associados a maiores níveis de imunoglobulinas.",
        "explanation": "A alternativa correta é a terceira. Leituras iguais ou superiores a 22% Brix são amplamente utilizadas como referência prática para identificar colostro com elevada concentração de imunoglobulinas. Valores menores podem indicar qualidade inferior.",
        "funFact": "O refratômetro de Brix tornou-se uma das ferramentas mais utilizadas no campo por ser rápido, simples e portátil."
    },

    {
        "id": 20203,
        "station": 2,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 3,
        "type": "interpretacao",
        "tags": ["pst", "ftip", "monitoramento"],
        "question": "Ao avaliar a eficiência do protocolo de colostragem por meio da Proteína Sérica Total (PST) em bezerros entre 2 e 7 dias de idade, qual resultado é compatível com transferência adequada de imunidade passiva em animais hidratados?",
        "options": [
            "Abaixo de 4,5 g/dL.",
            "Entre 4,5 e 5,0 g/dL.",
            "Igual ou superior a 5,5 g/dL.",
            "A PST não possui relação com a transferência de imunidade passiva."
        ],
        "correct": 2,
        "hint": "Valores mais elevados refletem maior absorção de proteínas provenientes do colostro.",
        "explanation": "Valores de PST iguais ou superiores a aproximadamente 5,5 g/dL, em bezerros adequadamente hidratados, são compatíveis com transferência satisfatória de imunidade passiva. Valores inferiores sugerem falha parcial ou completa na colostragem.",
        "funFact": "O monitoramento periódico da PST permite avaliar a qualidade do manejo de maternidade em nível de rebanho."
    },

    {
        "id": 20301,
        "station": 2,
        "species": "Bovinos",
        "audience": "veterinario",
        "difficulty": 2,
        "type": "calculo",
        "tags": ["colostragem", "volume", "manejo"],
        "question": "Um bezerro Holandês nasce com aproximadamente 40 kg. Considerando a recomendação de fornecer cerca de 10% do peso corporal em colostro na primeira alimentação, qual volume deve ser ofertado?",
        "options": [
            "2 litros.",
            "4 litros.",
            "6 litros.",
            "1 litro."
        ],
        "correct": 1,
        "hint": "Calcule 10% do peso vivo estimado.",
        "explanation": "A alternativa correta é 4 litros. A recomendação prática é oferecer aproximadamente 10% do peso corporal em colostro de boa qualidade o mais cedo possível, buscando fornecer quantidade suficiente de imunoglobulinas para uma adequada transferência de imunidade passiva.",
        "funFact": "Quando o bezerro não consegue ingerir voluntariamente o volume necessário, a sonda esofágica pode ser utilizada por profissionais treinados."
    },

    {
        "id": 20302,
        "station": 2,
        "species": "Ovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["ftip", "plasma", "cordeiros"],
        "question": "CASO CLÍNICO: Um grupo de cordeiros com aproximadamente 36 horas de vida apresenta falha confirmada de transferência de imunidade passiva durante um surto de diarreia neonatal. Considerando que a absorção intestinal de imunoglobulinas já está praticamente encerrada, qual abordagem oferece maior potencial de proteção sistêmica imediata?",
        "options": [
            "Administrar colostro por via oral como única medida.",
            "Realizar terapia com plasma ou soro apropriado conforme avaliação clínica e protocolos veterinários.",
            "Oferecer apenas substituto lácteo comercial.",
            "Aguardar a produção espontânea de anticorpos pelo próprio cordeiro."
        ],
        "correct": 1,
        "hint": "Após o fechamento intestinal, anticorpos administrados por via oral têm absorção sistêmica muito limitada.",
        "explanation": "Após aproximadamente 24 horas de vida, a capacidade intestinal de absorver imunoglobulinas é drasticamente reduzida. Nessa situação, terapias utilizando plasma ou soro apropriado podem fornecer imunidade passiva sistêmica conforme indicação clínica, enquanto apenas administrar colostro oral não corrige adequadamente a deficiência circulante.",
        "funFact": "Programas eficientes de colostragem reduzem significativamente a incidência de diarreias, pneumonias e mortalidade neonatal em pequenos ruminantes."
    },
    // --- ESTAÇÃO 3: HIPOTERMIA NEONATAL ---
    {
        "id": 30101,
        "station": 3,
        "species": "Ovinos",
        "audience": "leigo",
        "difficulty": 1,
        "type": "prevencao",
        "tags": ["hipotermia", "cordeiro", "aquecimento"],
        "question": "❄️ Um cordeiro acabou de nascer em uma noite fria e chuvosa e apresenta tremores intensos, orelhas frias e dificuldade para ficar em pé. Qual deve ser sua primeira atitude?",
        "options": [
            "Secá-lo imediatamente, protegê-lo do vento e aquecê-lo em um ambiente adequado.",
            "Dar um banho frio para estimular a circulação.",
            "Colocá-lo para correr no pasto até aquecer sozinho.",
            "Esperar algumas horas para ver se melhora espontaneamente."
        ],
        "correct": 0,
        "hint": "O maior inimigo do recém-nascido molhado é a rápida perda de calor corporal.",
        "explanation": "A alternativa correta é secar o cordeiro, protegê-lo do frio e fornecer aquecimento gradual. Animais recém-nascidos possuem pouca capacidade de manter a temperatura corporal e podem evoluir rapidamente para hipotermia grave. As demais opções aumentam ainda mais a perda de calor e colocam o animal em risco.",
        "funFact": "Um cordeiro molhado perde calor muito mais rapidamente do que um cordeiro seco, principalmente quando há vento."
    },

    {
        "id": 30102,
        "station": 3,
        "species": "Ovinos",
        "audience": "leigo",
        "difficulty": 2,
        "type": "conceitual",
        "tags": ["maternidade", "colostro", "hipotermia"],
        "question": "Qual comportamento materno aumenta o risco de um cordeiro desenvolver hipotermia logo após o nascimento?",
        "options": [
            "Lamber o cordeiro após o parto.",
            "Impedir ou dificultar que o filhote mame o colostro.",
            "Permanecer próxima do recém-nascido.",
            "Chamar o cordeiro por meio de vocalizações."
        ],
        "correct": 1,
        "hint": "Sem alimentação adequada, o recém-nascido perde rapidamente sua principal fonte de energia.",
        "explanation": "Quando a mãe rejeita o filhote ou impede a mamada, ele deixa de receber energia e imunidade fornecidas pelo colostro, aumentando o risco de hipotermia, hipoglicemia e mortalidade neonatal. Os demais comportamentos favorecem o vínculo materno-filial.",
        "funFact": "A ingestão precoce de colostro é importante tanto para a imunidade quanto para o fornecimento de energia necessária à produção de calor."
    },

    {
        "id": 30103,
        "station": 3,
        "species": "Bovinos",
        "audience": "leigo",
        "difficulty": 1,
        "type": "prevencao",
        "tags": ["bezerro", "colostro", "frio"],
        "question": "❄️ Além de secar e proteger um bezerro recém-nascido do vento, o que ajuda seu organismo a produzir calor?",
        "options": [
            "Garantir que ele receba colostro o mais cedo possível.",
            "Fazer o animal correr pelo curral.",
            "Dar apenas água morna.",
            "Cobri-lo sem permitir que mame."
        ],
        "correct": 0,
        "hint": "O organismo precisa de combustível para gerar calor.",
        "explanation": "O colostro fornece energia de rápida utilização e nutrientes importantes para manter o metabolismo do recém-nascido. Apenas aquecer externamente sem garantir ingestão adequada de energia pode não ser suficiente para evitar a hipotermia.",
        "funFact": "Nos primeiros dias de vida, grande parte da energia utilizada pelo bezerro vem do colostro."
    },

    {
        "id": 30201,
        "station": 3,
        "species": "Ovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "fisiologia",
        "tags": ["gordura_marrom", "termogenese"],
        "question": "Qual estrutura é a principal responsável pela termogênese não tremulante em cordeiros recém-nascidos?",
        "options": [
            "Tecido adiposo marrom ativado por mecanismos neuroendócrinos.",
            "Fermentação ruminal acelerada.",
            "Glicogênio muscular exclusivamente.",
            "Tecido adiposo branco subcutâneo."
        ],
        "correct": 0,
        "hint": "Esse tecido possui elevada quantidade de mitocôndrias especializadas na produção de calor.",
        "explanation": "O tecido adiposo marrom é responsável pela produção rápida de calor por meio da termogênese não tremulante. A fermentação ruminal ainda é pouco desenvolvida no neonato, e o tecido adiposo branco não possui a mesma função termogênica.",
        "funFact": "A proteína UCP-1 presente nas mitocôndrias do tecido adiposo marrom permite gerar calor em vez de ATP."
    },

    {
        "id": 30202,
        "station": 3,
        "species": "Ovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "interpretacao",
        "tags": ["temperatura", "avaliacao"],
        "question": "Um cordeiro apresenta temperatura retal de 37,8°C, reflexo de sucção preservado e consegue permanecer em estação com dificuldade. Como esse quadro pode ser interpretado?",
        "options": [
            "Hipotermia leve a moderada, ainda permitindo intervenção oral e aquecimento gradual.",
            "Hipotermia profunda incompatível com sobrevivência.",
            "Temperatura completamente normal para neonatos.",
            "Quadro típico de hipertermia infecciosa."
        ],
        "correct": 0,
        "hint": "Observe tanto a temperatura quanto a presença do reflexo de sucção.",
        "explanation": "O animal apresenta redução moderada da temperatura corporal, porém mantém capacidade de sucção e resposta aos estímulos, permitindo aquecimento progressivo associado ao fornecimento adequado de colostro quando indicado.",
        "funFact": "A avaliação do reflexo de sucção auxilia na escolha segura da via de alimentação do recém-nascido."
    },

    {
        "id": 30203,
        "station": 3,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "aplicacao",
        "tags": ["termogenese", "bezerros"],
        "question": "Durante exposição ao frio intenso, qual reserva energética participa de forma importante da produção inicial de calor em bezerros recém-nascidos?",
        "options": [
            "Tecido adiposo marrom.",
            "Conteúdo do rúmen totalmente desenvolvido.",
            "Proteínas musculares como principal fonte fisiológica.",
            "Minerais armazenados no fígado."
        ],
        "correct": 0,
        "hint": "Essa reserva é abundante em mitocôndrias especializadas na geração de calor.",
        "explanation": "O tecido adiposo marrom participa da termogênese não tremulante nos primeiros dias de vida. Caso suas reservas sejam consumidas sem adequada ingestão energética, o risco de hipotermia aumenta significativamente.",
        "funFact": "As reservas de gordura marrom diminuem rapidamente após o nascimento conforme o metabolismo neonatal se adapta."
    },

    {
        "id": 30301,
        "station": 3,
        "species": "Ovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["hipotermia", "emergencia", "cordeiro"],
        "question": "CASO CLÍNICO: Um cordeiro de aproximadamente 12 horas apresenta temperatura retal de 35,5°C e ausência de reflexo de sucção. Qual princípio deve orientar a abordagem inicial?",
        "options": [
            "Realizar apenas aquecimento externo intenso imediatamente.",
            "Corrigir o estado metabólico e instituir aquecimento gradual conforme avaliação clínica.",
            "Administrar grande volume de colostro por via oral imediatamente.",
            "Liberar o animal junto à mãe sem intervenção."
        ],
        "correct": 1,
        "hint": "Animais profundamente hipotérmicos frequentemente apresentam alterações energéticas importantes.",
        "explanation": "Em quadros graves de hipotermia neonatal, a estabilização metabólica e o aquecimento progressivo devem ser conduzidos de forma criteriosa pelo médico-veterinário, considerando o estado clínico do paciente e reduzindo riscos associados ao reaquecimento inadequado.",
        "funFact": "Hipotermia e hipoglicemia frequentemente ocorrem juntas em cordeiros neonatos."
    },

    {
        "id": 30302,
        "station": 3,
        "species": "Bovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["fluidoterapia", "hipotermia", "bezerro"],
        "question": "CASO CLÍNICO: Um bezerro recém-nascido é encontrado em decúbito após uma tempestade, com temperatura retal de 34,5°C e ausência de reflexo de sucção. Qual princípio terapêutico é mais adequado?",
        "options": [
            "Fornecer imediatamente grande volume de leite por via oral.",
            "Estabilizar o paciente com suporte apropriado, incluindo correção metabólica quando indicada e reaquecimento gradual.",
            "Submergir o animal em água muito quente para acelerar o aquecimento.",
            "Realizar apenas massagens vigorosas até o retorno dos reflexos."
        ],
        "correct": 1,
        "hint": "Em casos graves, a estabilização sistêmica deve preceder medidas agressivas de aquecimento.",
        "explanation": "Bezerros profundamente hipotérmicos exigem suporte clínico criterioso para correção de alterações circulatórias e metabólicas, seguido de aquecimento progressivo. Medidas bruscas ou alimentação oral em animais sem reflexo de sucção aumentam o risco de complicações.",
        "funFact": "O monitoramento contínuo da temperatura corporal é fundamental para avaliar a resposta ao tratamento da hipotermia neonatal."
    },

    // --- ESTAÇÃO 4: INFECÇÕES NEONATAIS ---
    {
        "id": 40101,
        "station": 4,
        "species": "all",
        "audience": "leigo",
        "difficulty": 1,
        "type": "prevencao",
        "tags": ["umbigo", "curativo", "iodo"],
        "question": "🧴 Qual é a forma mais segura de cuidar do umbigo do filhote logo após o nascimento?",
        "options": [
            "Mergulhar completamente o umbigo em solução de iodo adequada para cura umbilical logo após o nascimento.",
            "Apenas borrifar spray repelente sobre a pele ao redor do umbigo.",
            "Lavar com água e sabão e cobrir com uma faixa.",
            "Não realizar nenhum cuidado, pois o umbigo fecha sozinho."
        ],
        "correct": 0,
        "hint": "O umbigo é uma das principais portas de entrada para bactérias nos primeiros dias de vida.",
        "explanation": "A cura umbilical correta reduz drasticamente o risco de infecções. A imersão completa do coto umbilical em solução apropriada permite que o produto alcance toda a estrutura externa e interna do cordão. Apenas borrifar produtos ou não realizar o procedimento aumenta o risco de infecções locais e sistêmicas.",
        "funFact": "Muitas septicemias neonatais começam por bactérias que entraram através de um umbigo mal manejado."
    },
    {
        "id": 40102,
        "station": 4,
        "species": "all",
        "audience": "leigo",
        "difficulty": 2,
        "type": "interpretacao",
        "tags": ["umbigo", "infeccao", "sinais"],
        "question": "Qual destes sinais sugere que o umbigo do filhote pode estar infectado?",
        "options": [
            "Umbigo seco e diminuindo de tamanho.",
            "Umbigo inchado, dolorido e com saída de secreção.",
            "Filhote mamando normalmente e ativo.",
            "Queda natural do coto umbilical após alguns dias."
        ],
        "correct": 1,
        "hint": "Infecções costumam causar aumento de volume, dor e secreções.",
        "explanation": "Umbigos infectados frequentemente apresentam aumento de volume, calor, dor e secreção. O problema pode se espalhar para articulações, fígado e corrente sanguínea. Umbigos secos e retraídos fazem parte da cicatrização normal.",
        "funFact": "Algumas infecções umbilicais podem permanecer escondidas internamente mesmo quando a parte externa parece normal."
    },
    {
        "id": 40103,
        "station": 4,
        "species": "Bovinos",
        "audience": "leigo",
        "difficulty": 3,
        "type": "tomada_decisao",
        "tags": ["diarreia", "bezerro", "manejo"],
        "question": "Um bezerro de poucos dias começou a apresentar diarreia intensa e está ficando abatido. Qual deve ser a prioridade imediata?",
        "options": [
            "Suspender totalmente a oferta de líquidos.",
            "Garantir hidratação e procurar avaliação veterinária rapidamente.",
            "Esperar vários dias para ver se melhora sozinho.",
            "Oferecer apenas ração sólida."
        ],
        "correct": 1,
        "hint": "A principal causa de morte nesses casos está relacionada à perda de água e eletrólitos.",
        "explanation": "A desidratação é a complicação mais perigosa das diarreias neonatais. Quanto antes a hidratação for corrigida e a causa identificada, maiores as chances de recuperação. Esperar a evolução do quadro pode permitir que o animal entre em choque.",
        "funFact": "Um bezerro jovem pode perder uma quantidade crítica de líquidos em poucas horas durante uma diarreia intensa."
    },
    {
        "id": 40201,
        "station": 4,
        "species": "all",
        "audience": "estudante",
        "difficulty": 1,
        "type": "conceitual",
        "tags": ["onfalite", "anatomia", "umbigo"],
        "question": "Quais estruturas fetais podem ser acometidas por uma infecção umbilical profunda?",
        "options": [
            "Apenas a pele e o tecido subcutâneo.",
            "Veia umbilical, artérias umbilicais e úraco.",
            "Somente o intestino delgado.",
            "Somente os músculos abdominais."
        ],
        "correct": 1,
        "hint": "O cordão umbilical contém vasos sanguíneos e uma estrutura ligada à bexiga fetal.",
        "explanation": "Infecções umbilicais podem progredir pela veia umbilical, artérias umbilicais e úraco, causando abscessos hepáticos, infecções urinárias e septicemia. Limitar a avaliação apenas à região externa pode atrasar o diagnóstico.",
        "funFact": "A ultrassonografia é uma ferramenta muito útil para avaliar estruturas umbilicais internas."
    },
    {
        "id": 40202,
        "station": 4,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "interpretacao",
        "tags": ["criptosporidiose", "diarreia", "zoonose"],
        "question": "Um bezerro de 8 dias apresenta diarreia aquosa. Exames identificam um protozoário zoonótico frequentemente associado a surtos em neonatos. Qual é o agente mais provável?",
        "options": [
            "Eimeria bovis",
            "Cryptosporidium parvum",
            "Strongyloides papillosus",
            "Fasciola hepatica"
        ],
        "correct": 1,
        "hint": "É um importante agente de diarreia em bezerros na primeira e segunda semana de vida.",
        "explanation": "Cryptosporidium parvum é uma das principais causas de diarreia neonatal em bovinos jovens. O agente compromete a absorção intestinal e possui potencial zoonótico. Eimeria costuma acometer animais mais velhos.",
        "funFact": "Os oocistos de Cryptosporidium são bastante resistentes no ambiente e podem sobreviver por longos períodos."
    },
    {
        "id": 40203,
        "station": 4,
        "species": "all",
        "audience": "estudante",
        "difficulty": 3,
        "type": "tomada_decisao",
        "tags": ["colostro", "imunidade", "septicemia"],
        "question": "Por que filhotes que não recebem colostro adequadamente apresentam maior risco de septicemia neonatal?",
        "options": [
            "Porque o colostro aumenta a temperatura corporal.",
            "Porque o colostro fornece imunoglobulinas essenciais para defesa contra microrganismos.",
            "Porque o colostro substitui todas as vacinas futuras.",
            "Porque o colostro impede completamente a colonização intestinal."
        ],
        "correct": 1,
        "hint": "Pense na principal função imunológica do colostro.",
        "explanation": "Sem a transferência adequada de imunoglobulinas, o recém-nascido permanece vulnerável a bactérias presentes no ambiente. Isso aumenta o risco de infecções sistêmicas, septicemia, artrites e meningites neonatais.",
        "funFact": "A falha de transferência de imunidade passiva é um dos principais fatores de risco para mortalidade neonatal."
    },
    {
        "id": 40301,
        "station": 4,
        "species": "Bovinos",
        "audience": "veterinario",
        "difficulty": 2,
        "type": "caso_clinico",
        "tags": ["diarreia", "acidose", "fluidoterapia"],
        "question": "CASO CLÍNICO: Bezerro de 7 dias apresenta diarreia aquosa intensa, perda do reflexo de sucção, enoftalmia acentuada e permanência em decúbito esternal. Qual a interpretação mais adequada?",
        "options": [
            "Desidratação leve tratável apenas por via oral.",
            "Desidratação grave associada a acidose metabólica, exigindo fluidoterapia intravenosa imediata.",
            "Quadro compatível apenas com parasitismo intestinal simples.",
            "Condição sem necessidade de correção hidroeletrolítica."
        ],
        "correct": 1,
        "hint": "A ausência de sucção e a enoftalmia importante indicam comprometimento sistêmico.",
        "explanation": "O quadro sugere desidratação grave e acidose metabólica. A fluidoterapia intravenosa é necessária para restaurar a perfusão tecidual, corrigir distúrbios eletrolíticos e melhorar o prognóstico. O atraso na intervenção aumenta o risco de choque e morte.",
        "funFact": "A profundidade do afundamento ocular é frequentemente utilizada para estimar o grau de desidratação em bezerros."
    },
    {
        "id": 40302,
        "station": 4,
        "species": "Bovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["septicemia", "meningite", "neonatologia"],
        "question": "CASO CLÍNICO: Bezerro de 4 dias apresenta febre alta, hipópio bilateral, petéquias em mucosas e sinais neurológicos. A fazenda possui histórico de falha de colostragem. Qual o diagnóstico mais provável?",
        "options": [
            "Septicemia neonatal com possível meningite bacteriana.",
            "Deficiência de vitamina A.",
            "Hipocalcemia neonatal isolada.",
            "Acidose ruminal."
        ],
        "correct": 0,
        "hint": "A combinação de sinais sistêmicos, oculares e neurológicos é altamente sugestiva de disseminação bacteriana.",
        "explanation": "A falha de transferência de imunidade passiva favorece bacteremias precoces. O comprometimento ocular e neurológico sugere disseminação sistêmica com possível meningite. O tratamento requer intervenção rápida, suporte intensivo e antimicrobianos adequados.",
        "funFact": "O hipópio resulta do acúmulo de células inflamatórias na câmara anterior do olho e pode ser um importante indicador de septicemia neonatal."
    },

    // --- ESTAÇÃO 5: NUTRIÇÃO DA LACTAÇÃO ---
    {
        "id": 50101,
        "station": 5,
        "species": "all",
        "audience": "leigo",
        "difficulty": 1,
        "type": "conceitual",
        "tags": ["leite", "agua", "alimentacao"],
        "question": "🌿 Qual é o nutriente mais importante para uma mãe produzir bastante leite durante a lactação?",
        "options": [
            "Sal mineral importado.",
            "Água limpa e fresca disponível à vontade.",
            "Ração concentrada rica em farelo de soja.",
            "Vitaminas injetáveis aplicadas diariamente."
        ],
        "correct": 1,
        "hint": "O leite é formado principalmente por esse nutriente.",
        "explanation": "A água é o nutriente mais importante para a produção de leite. Quando o consumo de água diminui, a produção pode cair rapidamente, mesmo que a alimentação esteja adequada.",
        "funFact": "Uma vaca leiteira de alta produção pode consumir mais de 100 litros de água por dia."
    },
    {
        "id": 50102,
        "station": 5,
        "species": "Bovinos",
        "audience": "leigo",
        "difficulty": 2,
        "type": "prevencao",
        "tags": ["alimentacao", "fibra", "leite"],
        "question": "🐄 O que nunca pode faltar na alimentação da vaca para manter o rúmen saudável e favorecer uma boa produção de gordura no leite?",
        "options": [
            "Somente milho moído e ração concentrada.",
            "Fibra de boa qualidade, como pastagem, feno ou silagem.",
            "Restos de alimentos domésticos.",
            "Óleo de cozinha misturado na água."
        ],
        "correct": 1,
        "hint": "A ruminação depende da presença de alimentos fibrosos.",
        "explanation": "A fibra estimula a ruminação e a produção de saliva, ajudando a manter o pH do rúmen adequado. Esse processo favorece a fermentação saudável e a produção dos componentes utilizados na síntese da gordura do leite.",
        "funFact": "Dietas com pouca fibra podem reduzir significativamente o teor de gordura do leite."
    },
    {
        "id": 50201,
        "station": 5,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "aplicacao",
        "tags": ["rumen", "sara", "concentrado"],
        "question": "O fornecimento excessivo e abrupto de concentrados ricos em amido no pós-parto aumenta o risco de qual distúrbio ruminal?",
        "options": [
            "Alcalose ruminal causada pelo excesso de ureia.",
            "Acidose Ruminal Subaguda (SARA), provocada pela redução do pH ruminal devido à intensa fermentação.",
            "Timpanismo por falha de motilidade do omaso.",
            "Paraqueratose intestinal causada por deficiência de fibra."
        ],
        "correct": 1,
        "hint": "O excesso de carboidratos rapidamente fermentáveis favorece a produção de ácidos no rúmen.",
        "explanation": "A introdução excessiva de concentrados sem adaptação adequada favorece o acúmulo de ácidos no rúmen, reduzindo o pH e predispondo à SARA, condição associada à queda da digestão de fibras, laminite e redução do desempenho produtivo.",
        "funFact": "Oscilações na porcentagem de gordura do leite podem ser um dos primeiros sinais de SARA no rebanho."
    },
    {
        "id": 50202,
        "station": 5,
        "species": "all",
        "audience": "estudante",
        "difficulty": 2,
        "type": "aplicacao",
        "tags": ["fisiologia", "lactacao", "curva_de_lactacao"],
        "question": "Em qual período normalmente ocorre o pico de produção de leite em vacas e ovelhas de alta produção?",
        "options": [
            "Nas primeiras 48 horas após o parto.",
            "Entre a 4ª e a 8ª semana após o parto.",
            "Somente no sexto mês de lactação.",
            "A produção permanece constante durante toda a lactação."
        ],
        "correct": 1,
        "hint": "O maior volume de leite costuma ocorrer antes do pico de consumo de matéria seca.",
        "explanation": "O pico de lactação geralmente acontece entre 30 e 60 dias após o parto. Nesse período, muitas fêmeas ainda não atingiram seu máximo consumo alimentar, favorecendo o balanço energético negativo e a mobilização de reservas corporais.",
        "funFact": "O pico de ingestão de alimento normalmente ocorre semanas depois do pico de produção de leite."
    },
    {
        "id": 50301,
        "station": 5,
        "species": "Ovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["hipocalcemia", "ovinos", "terapeutica"],
        "question": "CASO CLÍNICO: Ovelha de alta produção, 14 dias pós-parto, apresenta tremores, rigidez muscular, evolução para decúbito esternal e pescoço em formato de 'S'. Qual o diagnóstico mais provável e a conduta indicada?",
        "options": [
            "Raiva ovina; realizar eutanásia imediata.",
            "Hipocalcemia da lactação; administrar gluconato de cálcio por via intravenosa lenta com monitoramento cardíaco.",
            "Polioencefalomalácia; administrar apenas tiamina por via intramuscular.",
            "Listeriose; iniciar antibioticoterapia com benzilpenicilina."
        ],
        "correct": 1,
        "hint": "A deficiência de cálcio compromete a transmissão neuromuscular.",
        "explanation": "A hipocalcemia da lactação provoca sinais neuromusculares decorrentes da redução do cálcio circulante. O tratamento consiste na administração lenta de gluconato de cálcio intravenoso, sempre sob monitoramento cardíaco devido ao risco de arritmias.",
        "funFact": "Muitos animais apresentam melhora clínica poucos minutos após o início da reposição intravenosa de cálcio."
    },

    // --- ESTAÇÃO 6: VACINAÇÃO E PREVENÇÃO ---
    {
        "id": 60101,
        "station": 6,
        "species": "all",
        "audience": "leigo",
        "difficulty": 1,
        "type": "prevencao",
        "tags": ["vacina", "mae", "colostro"],
        "question": "💉 Por que é recomendado vacinar vacas e ovelhas prenhas algumas semanas antes do parto?",
        "options": [
            "Para que a mãe produza mais leite logo após o parto.",
            "Para aumentar a quantidade de anticorpos no colostro e proteger o filhote nas primeiras semanas de vida.",
            "Porque a vacina protege apenas a mãe e não influencia o filhote.",
            "Para evitar que o leite estrague após a ordenha."
        ],
        "correct": 1,
        "hint": "Os anticorpos produzidos pela mãe passam para o colostro e são absorvidos pelo recém-nascido.",
        "explanation": "A vacinação no final da gestação estimula a produção de anticorpos que se concentram no colostro. Quando o filhote mama logo após nascer, recebe essa proteção contra diversas doenças até que seu próprio sistema imunológico amadureça.",
        "funFact": "Essa estratégia é conhecida como imunização materna e é uma das formas mais eficientes de proteger recém-nascidos."
    },
    {
        "id": 60102,
        "station": 6,
        "species": "Bovinos",
        "audience": "leigo",
        "difficulty": 2,
        "type": "prevencao",
        "tags": ["tristeza_parasitaria", "carrapato", "bezerro"],
        "question": "Um bezerro de poucos meses apresenta febre, anemia e urina escura. Qual parasita costuma transmitir essa doença?",
        "options": [
            "Moscas-varejeiras.",
            "Carrapatos dos bovinos.",
            "Vermes intestinais presentes no pasto.",
            "Larvas de mosquito presentes na água."
        ],
        "correct": 1,
        "hint": "O agente transmissor alimenta-se do sangue do animal.",
        "explanation": "O carrapato bovino transmite agentes como Babesia e Anaplasma, responsáveis pela Tristeza Parasitária Bovina. Esses microrganismos destroem as hemácias e podem causar anemia grave e morte se não houver tratamento.",
        "funFact": "Animais de raças europeias costumam ser mais sensíveis à doença do que muitas raças zebuínas."
    },
    {
        "id": 60201,
        "station": 6,
        "species": "Ovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "prevencao",
        "tags": ["clostridiose", "enterotoxemia", "toxinas"],
        "question": "Qual doença clostridial é conhecida como 'Doença do Rim Polposo' e costuma acometer cordeiros em crescimento?",
        "options": [
            "Tétano causado por Clostridium tetani.",
            "Enterotoxemia causada por Clostridium perfringens tipo D.",
            "Carbúnculo sintomático causado por Clostridium chauvoei.",
            "Botulismo causado por Clostridium botulinum."
        ],
        "correct": 1,
        "hint": "Está relacionada à produção da toxina épsilon.",
        "explanation": "A enterotoxemia causada por Clostridium perfringens tipo D está associada à produção da toxina épsilon e pode provocar morte súbita em cordeiros alimentados com dietas ricas em energia. A vacinação das matrizes ajuda a proteger os recém-nascidos por meio do colostro.",
        "funFact": "Muitas vezes os animais mais bem nutridos do lote são justamente os mais acometidos."
    },
    {
        "id": 60301,
        "station": 6,
        "species": "all",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "aplicacao",
        "tags": ["imunologia", "anticorpos_maternos", "janela_imunologica"],
        "question": "Por que a vacinação contra diversos patógenos sistêmicos costuma ser evitada na primeira semana de vida de cordeiros e bezerros?",
        "options": [
            "Porque o sistema imunológico neonatal é incapaz de reconhecer antígenos.",
            "Porque os anticorpos maternos adquiridos pelo colostro podem neutralizar os antígenos vacinais antes da resposta ativa do filhote.",
            "Porque os adjuvantes vacinais provocam involução precoce do timo.",
            "Porque existe baixa absorção do imunizante no tecido subcutâneo neonatal."
        ],
        "correct": 1,
        "hint": "Os anticorpos maternos ainda circulam em alta concentração nesse período.",
        "explanation": "Os anticorpos transferidos pelo colostro podem se ligar aos antígenos da vacina e impedir que o sistema imunológico do filhote desenvolva uma resposta ativa eficiente. Por isso, os protocolos vacinais normalmente são iniciados após a redução desses anticorpos maternos.",
        "funFact": "O intervalo em que os anticorpos maternos já não protegem totalmente contra infecções, mas ainda podem interferir na vacinação, é conhecido como janela imunológica."
    },
    {
        "id": 60302,
        "station": 6,
        "species": "Bovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "aplicacao",
        "tags": ["bvd", "pi", "imunologia"],
        "question": "No controle da Diarreia Viral Bovina (BVD), qual é um dos principais objetivos da vacinação estratégica de matrizes antes da cobertura ou durante protocolos recomendados?",
        "options": [
            "Aumentar apenas a produção de IgA salivar nas vacas.",
            "Reduzir o risco de nascimento de animais persistentemente infectados (PI), importantes reservatórios do vírus.",
            "Estimular reação cutânea para repelir vetores biológicos.",
            "Neutralizar o vírus apenas no rúmen."
        ],
        "correct": 1,
        "hint": "Animais PI podem eliminar o vírus continuamente durante a vida.",
        "explanation": "A vacinação das matrizes busca proteger o feto contra infecções durante a gestação, reduzindo a formação de animais persistentemente infectados (PI), que representam uma das principais fontes de disseminação do BVDV no rebanho.",
        "funFact": "Um bovino PI pode aparentar estar saudável e ainda assim eliminar grandes quantidades de vírus continuamente."
    },

    // --- ESTAÇÃO 7: GESTÃO E INDICADORES ---
    {
        "id": 70101,
        "station": 7,
        "species": "all",
        "audience": "leigo",
        "difficulty": 1,
        "type": "interpretacao",
        "tags": ["meta", "mortalidade", "sucesso"],
        "question": "📊 Em uma fazenda bem manejada, qual é a meta desejável para a mortalidade de filhotes no primeiro mês de vida?",
        "options": [
            "Até 50% dos nascidos vivos.",
            "Manter a mortalidade abaixo de aproximadamente 5% a 8%, dependendo da espécie e do sistema de produção.",
            "Até 25% dos filhotes é considerado normal.",
            "A mortalidade não é um indicador importante."
        ],
        "correct": 1,
        "hint": "Quanto menor esse índice, melhor costuma ser o manejo neonatal.",
        "explanation": "Baixas taxas de mortalidade neonatal refletem bons programas de colostragem, higiene, manejo sanitário e assistência ao parto. Valores elevados indicam necessidade de revisão dos protocolos da propriedade.",
        "funFact": "Reduções pequenas na mortalidade neonatal podem representar grande impacto econômico ao longo do ano."
    },
    {
        "id": 70201,
        "station": 7,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "calculo",
        "tags": ["tmn", "indicador", "zootecnia"],
        "question": "Uma fazenda registrou 120 bezerras nascidas vivas e 12 mortes antes dos 28 dias de idade. Qual é a Taxa de Mortalidade Neonatal (TMN)?",
        "options": [
            "1,2%",
            "10%",
            "20%",
            "5%"
        ],
        "correct": 1,
        "hint": "Use a fórmula: (mortes ÷ nascidos vivos) × 100.",
        "explanation": "TMN = (12 ÷ 120) × 100 = 10%. Esse valor está acima da meta normalmente recomendada para bezerras leiteiras e indica necessidade de investigação das causas de mortalidade.",
        "funFact": "A TMN é um dos principais indicadores utilizados para avaliar a eficiência do manejo neonatal."
    },
    {
        "id": 70202,
        "station": 7,
        "species": "Ovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "calculo",
        "tags": ["taxa_de_desmame", "produtividade", "indicador"],
        "question": "Um rebanho possui 200 ovelhas prenhas e desmamou 240 cordeiros. Qual foi a taxa de desmame aparente?",
        "options": [
            "120%, resultado compatível com elevada ocorrência de partos gemelares.",
            "80%, indicando perdas antes da desmama.",
            "24%, indicando erro de cálculo.",
            "A taxa nunca pode ultrapassar 100%."
        ],
        "correct": 0,
        "hint": "Divida o número de cordeiros desmamados pelo número de matrizes prenhas e multiplique por 100.",
        "explanation": "240 ÷ 200 × 100 = 120%. Em ovinos, taxas superiores a 100% são possíveis devido à ocorrência de gestações gemelares ou múltiplas.",
        "funFact": "Em algumas raças altamente prolíficas, taxas superiores a 150% são alcançadas em sistemas bem manejados."
    },
    {
        "id": 70301,
        "station": 7,
        "species": "all",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "calculo",
        "tags": ["roi", "custo_beneficio", "planejamento"],
        "question": "Uma propriedade com 500 matrizes reduz sua mortalidade neonatal de 18% para 6% após um investimento de R$ 5.000,00. Considerando cordeiros avaliados em R$ 300,00 cada, qual alternativa representa corretamente o retorno econômico?",
        "options": [
            "O investimento não gera retorno financeiro.",
            "São preservados cerca de 60 cordeiros, gerando R$ 18.000,00 em receita bruta e ROI aproximado de 260%.",
            "O ganho bruto é de R$ 36.000,00.",
            "Há apenas benefício em bem-estar animal, sem impacto econômico."
        ],
        "correct": 1,
        "hint": "Calcule primeiro a diferença percentual de mortalidade e depois estime quantos animais deixaram de morrer.",
        "explanation": "A redução de 12 pontos percentuais representa aproximadamente 60 cordeiros preservados (500 × 0,12). Multiplicando por R$ 300,00 obtém-se R$ 18.000,00 de receita bruta. Descontando o investimento, o retorno líquido é de R$ 13.000,00, equivalente a cerca de 260% de ROI.",
        "funFact": "Indicadores econômicos costumam facilitar a adoção de melhorias sanitárias pelos produtores."
    },
    {
        "id": 70302,
        "station": 7,
        "species": "all",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "interpretacao",
        "tags": ["curva_de_mortalidade", "epidemiologia", "auditoria"],
        "question": "Em uma auditoria, 75% das mortes de bezerras ocorrem entre o 3º e o 10º dia de vida, principalmente por diarreia. Qual é o principal gargalo operacional sugerido por esse padrão?",
        "options": [
            "Problemas no manejo da desmama.",
            "Falhas na colostragem e/ou elevada contaminação ambiental logo após o nascimento.",
            "Deficiência proteica na dieta pós-desmama.",
            "Problemas relacionados à vacinação de fêmeas adultas contra raiva."
        ],
        "correct": 1,
        "hint": "Pense no que mais influencia a proteção do recém-nascido durante a primeira semana de vida.",
        "explanation": "Mortes concentradas nos primeiros dias de vida frequentemente indicam transferência inadequada de imunidade passiva, associada ou não a elevada pressão de infecção ambiental. A revisão da colostragem e das condições de higiene da maternidade deve ser prioridade.",
        "funFact": "A distribuição das mortes ao longo da idade pode ajudar a identificar rapidamente falhas específicas de manejo dentro da fazenda."
    },
];

/* ==========================================================================
   BANCO EXPANDIDO — 42 QUESTÕES NOVAS (Auditoria v2)
   2 por estação × 7 estações × 3 níveis = 42 questões inéditas
   ========================================================================== */
const NOVAS_QUESTOES = [
        {
    "id": 10105,
    "station": 1,
    "species": "all",
    "audience": "leigo",
    "difficulty": 1,
    "type": "conceitual",
    "tags": ["parto", "sinais", "manejo"],
    "question": "🐄🐑 Quais são os sinais mais claros de que uma vaca ou ovelha está prestes a parir nas próximas horas?",
    "options": [
        "O animal come mais do que o habitual, fica agitado e vocaliza constantemente no meio do rebanho.",
        "O úbere fica mais cheio, a vulva fica relaxada e aumentada de volume, os ligamentos da garupa relaxam e a fêmea tende a se isolar do restante do rebanho.",
        "Os olhos ficam vermelhos, o animal começa a coxear e a temperatura cai para menos de 35°C.",
        "A fêmea começa a recusar água e a esfregar o focinho no chão repetidamente durante horas."
    ],
    "correct": 1,
    "hint": "Observe mudanças no úbere, na vulva, na região da garupa e no comportamento da mãe nas horas que antecedem o parto.",
    "explanation": "Nas horas que antecedem o parto, ocorre relaxamento dos ligamentos pélvicos (fazendo a garupa parecer mais afundada), aumento e relaxamento da vulva, enchimento do úbere e comportamento de isolamento. Esses sinais ajudam o produtor a acompanhar a evolução do parto e intervir rapidamente caso surja alguma dificuldade.",
    "funFact": "Embora algumas vacas apresentem colostro visível antes do parto, isso varia bastante entre animais e não deve ser usado isoladamente para prever quando ocorrerá o nascimento."
    },

        {
    "id": 10106,
    "station": 1,
    "species": "all",
    "audience": "leigo",
    "difficulty": 2,
    "type": "prevencao",
    "tags": ["distocia", "emergencia", "parto"],
    "question": "Quanto tempo uma fêmea pode permanecer em trabalho de parto ativo sem progresso antes de ser avaliada por um médico-veterinário?",
    "options": [
        "Não existe limite. A natureza sempre resolve sozinha.",
        "Se houver contrações fortes e não houver progresso na expulsão do filhote por aproximadamente 1 hora em ovelhas ou 2 horas em vacas, é indicado solicitar avaliação veterinária.",
        "O prazo seguro é de 24 horas de esforço intenso.",
        "Só é necessário chamar o veterinário quando o filhote já morreu."
    ],
    "correct": 1,
    "hint": "Contrações fortes sem evolução do parto podem indicar distócia e colocar mãe e filhote em risco.",
    "explanation": "Embora o tempo possa variar entre casos, a ausência de progresso após cerca de 1 hora de esforço ativo em ovinos ou 2 horas em bovinos justifica avaliação veterinária. A demora aumenta o risco de hipóxia fetal, trauma obstétrico e complicações maternas.",
    "funFact": "O reconhecimento precoce da distócia melhora significativamente as chances de sobrevivência tanto da mãe quanto do filhote."
    },

    {
    "id": 10204,
    "station": 1,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 2,
    "type": "aplicacao",
    "tags": ["periodo_transicao", "far_off", "close_up", "nutricao"],
    "question": "Na nutrição de vacas no período de transição, qual a principal diferença entre as fases far-off e close-up?",
    "options": [
        "Não há diferença entre elas; a dieta permanece igual durante todo o período seco.",
        "Na fase far-off busca-se manter adequado escore corporal e saúde metabólica; na fase close-up ocorre adaptação gradual da dieta para preparar a vaca para o início da lactação.",
        "Na fase far-off fornece-se máxima energia para ganho de peso fetal e na close-up restringe-se totalmente o cálcio.",
        "A fase far-off utiliza apenas sais aniônicos e a close-up apenas volumoso."
    ],
    "correct": 1,
    "hint": "O objetivo final é preparar o metabolismo da vaca para o parto e para a lactação.",
    "explanation": "Na fase far-off prioriza-se manutenção do escore corporal adequado e prevenção de excesso de condição corporal. Nas semanas finais (close-up), adapta-se progressivamente a dieta àquela que será utilizada após o parto, favorecendo maior consumo de matéria seca e reduzindo distúrbios metabólicos.",
    "funFact": "Uma boa dieta de transição está associada à redução da incidência de cetose, deslocamento de abomaso e retenção de placenta."
    },

    {
    "id": 10205,
    "station": 1,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 2,
    "type": "interpretacao",
    "tags": ["cetose", "bhb", "monitoramento", "pre_parto"],
    "question": "Qual método é amplamente utilizado para monitorar o risco de cetose em vacas no período de transição?",
    "options": [
        "Mensuração do pH urinário.",
        "Dosagem sanguínea de beta-hidroxibutirato (BHB) utilizando aparelho portátil ou laboratório.",
        "Avaliação apenas da consistência das fezes.",
        "Pesagem semanal como único critério diagnóstico."
    ],
    "correct": 1,
    "hint": "O BHB é um dos principais corpos cetônicos utilizados para monitorar o metabolismo energético das vacas.",
    "explanation": "A mensuração do beta-hidroxibutirato (BHB) é uma ferramenta prática para identificar vacas com maior risco de cetose clínica ou subclínica durante o período de transição. Valores acima de 0,6 mmol/L no pré-parto indicam lipomobilização precoce e risco aumentado de cetose clínica nas primeiras semanas de lactação, possibilitando intervenção nutricional antes que o problema se instale.",
    "funFact": "O monitoramento rotineiro do BHB pode identificar alterações metabólicas antes mesmo do aparecimento dos sinais clínicos."
    },

    {
    "id": 10303,
    "station": 1,
    "species": "Bovinos",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "aplicacao",
    "tags": ["dcad", "sais_anionicos", "pH_urinario", "hipocalcemia"],
    "question": "Ao utilizar dietas aniônicas (DCAD negativo) no pré-parto, qual método é empregado rotineiramente para monitorar a resposta do rebanho?",
    "options": [
        "Dosagem periódica de PTH sérico em todas as vacas.",
        "Mensuração do pH urinário das vacas para verificar se a acidificação metabólica desejada foi atingida.",
        "Avaliação exclusiva do escore corporal.",
        "Coleta rotineira de líquido ruminal para mensuração do pH."
    ],
    "correct": 1,
    "hint": "O monitoramento é simples, rápido e pode ser realizado diretamente na fazenda com fitas ou medidores apropriados.",
    "explanation": "A mensuração do pH urinário é o método de campo mais utilizado para verificar se a dieta aniônica está promovendo a acidificação metabólica esperada. pH entre 6,0 e 6,8 confirma acidose metabólica compensada adequada para sensibilizar os receptores de PTH nos ossos e rins. pH acima de 7,5 indica que o protocolo não está funcionando (problemas de palatabilidade ou formulação incorreta). pH abaixo de 5,5 indica acidose excessiva, com risco de anorexia e imunossupressão.",
    "funFact": "Para vacas zebuínas (Bos indicus), as metas de pH urinário são ligeiramente mais altas (6,2–7,0) em razão de sua maior eficiência de absorção intestinal de cálcio em comparação às raças europeias como a Holandesa e a Jersey."
    },

    {
    "id": 10304,
    "station": 1,
    "species": "Bovinos",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "caso_clinico",
    "tags": ["distocia", "obstetrica", "manobra", "cesarea"],
    "question": "CASO CLÍNICO: Durante o exame obstétrico de uma vaca em trabalho de parto, identifica-se apresentação anterior, posição dorsal e desvio lateral da cabeça do feto. Qual deve ser a primeira abordagem?",
    "options": [
        "Administrar ocitocina imediatamente e aguardar evolução espontânea.",
        "Promover retropulsão quando necessário, corrigir cuidadosamente o desvio da cabeça e somente então avaliar a possibilidade de extração vaginal; caso a correção não seja possível ou o prognóstico seja desfavorável, considerar intervenção cirúrgica.",
        "Aplicar tração máxima imediatamente sobre os membros anteriores.",
        "Indicar cesariana obrigatória em todos os casos de desvio lateral de cabeça."
    ],
    "correct": 1,
    "hint": "A correção da postura fetal é fundamental antes de qualquer tentativa de tração.",
    "explanation": "O desvio lateral da cabeça aumenta o diâmetro fetal e impede a passagem pelo canal do parto. A correção obstétrica, frequentemente com auxílio de retropulsão e lubrificação adequada, deve preceder qualquer tentativa de extração. A decisão por cesariana depende da viabilidade da correção, do estado materno-fetal e da evolução do caso.",
    "funFact": "Nem toda distócia por desvio de cabeça exige cesariana; muitas podem ser resolvidas por correção obstétrica quando diagnosticadas precocemente e conduzidas adequadamente."
    },

    {
    "id": 20104,
    "station": 2,
    "species": "all",
    "audience": "leigo",
    "difficulty": 2,
    "type": "prevencao",
    "tags": ["qualidade_colostro", "manejo", "mae"],
    "question": "🍼 Quais situações podem reduzir a qualidade do colostro produzido pela mãe e diminuir a proteção do filhote?",
    "options": [
        "Novilhas de primeira cria, perdas de colostro antes do parto e algumas condições de manejo ou saúde que comprometem sua formação.",
        "A qualidade do colostro é sempre igual, independentemente da idade, saúde ou nutrição da mãe.",
        "Somente animais de raças importadas produzem colostro de baixa qualidade.",
        "Beber muita água no final da gestação dilui os anticorpos do colostro."
    ],
    "correct": 0,
    "hint": "A idade da mãe, sua saúde e perdas de colostro antes do parto podem influenciar a quantidade de anticorpos disponível para o filhote.",
    "explanation": "Novilhas costumam produzir colostro com menor concentração de anticorpos do que vacas adultas devido à menor exposição prévia a agentes infecciosos. Além disso, perdas de colostro antes do parto e alguns problemas nutricionais ou de manejo podem comprometer sua qualidade. Por isso, muitas propriedades mantêm um banco de colostro proveniente de vacas saudáveis e de boa qualidade.",
    "funFact": "O refratômetro de Brix permite estimar rapidamente a qualidade do colostro. Em bovinos, leituras iguais ou superiores a 22% costumam indicar colostro de excelente qualidade."
    },

    {
    "id": 20105,
    "station": 2,
    "species": "Bovinos",
    "audience": "leigo",
    "difficulty": 2,
    "type": "aplicacao",
    "tags": ["sonda_esofagica", "mamadeira", "bezerro_fraco"],
    "question": "Se um bezerro recém-nascido está muito fraco para mamar sozinho, qual é a melhor forma de garantir que ele receba o colostro rapidamente?",
    "options": [
        "Esperar até que ele consiga levantar sozinho, mesmo que demore muitas horas.",
        "Ordenhar o colostro da mãe e fornecê-lo por mamadeira ou, quando indicado e por pessoa treinada, utilizando uma sonda esofágica.",
        "Forçar o bezerro a mamar diretamente na vaca mesmo sem conseguir deglutir adequadamente.",
        "Substituir o colostro por leite comum de outra vaca em lactação."
    ],
    "correct": 1,
    "hint": "O objetivo é fornecer colostro o mais cedo possível utilizando um método seguro para o animal.",
    "explanation": "Quando o bezerro não consegue mamar sozinho, o colostro deve ser fornecido rapidamente. A mamadeira costuma ser a primeira opção e, quando necessário, uma sonda esofágica utilizada por pessoa devidamente treinada permite que o colostro chegue ao estômago com segurança, reduzindo atrasos na transferência de imunidade passiva.",
    "funFact": "A eficiência de absorção dos anticorpos do colostro diminui rapidamente nas primeiras horas após o nascimento."
    },

    {
    "id": 20204,
    "station": 2,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 2,
    "type": "imunologia",
    "tags": ["igg1", "igg2", "imunidade_passiva", "colostro"],
    "question": "No sistema imunológico bovino, qual é a principal característica da IgG1 presente no colostro?",
    "options": [
        "É produzida exclusivamente pelo baço fetal durante a gestação.",
        "É a principal imunoglobulina do colostro bovino e é transportada seletivamente da circulação materna para a glândula mamária, contribuindo para a imunidade passiva do neonato.",
        "Não existe diferença funcional entre IgG1 e IgG2 em bovinos.",
        "A IgG2 representa mais de 90% das imunoglobulinas presentes no colostro."
    ],
    "correct": 1,
    "hint": "A principal imunoglobulina do colostro bovino é transportada ativamente para a secreção mamária.",
    "explanation": "A IgG1 corresponde à maior parte das imunoglobulinas presentes no colostro bovino e é transportada seletivamente do sangue materno para a glândula mamária. Após ser absorvida pelo recém-nascido nas primeiras horas de vida, contribui para a proteção sistêmica contra diversos agentes infecciosos.",
    "funFact": "Além da IgG1, o colostro também contém IgA e IgM, importantes para a defesa das mucosas do trato digestório."
    },

    {
    "id": 20205,
    "station": 2,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 3,
    "type": "prevencao",
    "tags": ["pasteurizacao", "johne", "mycobacterium", "biosseguridade"],
    "question": "Por que a pasteurização do colostro bovino a aproximadamente 60°C por 60 minutos pode ser utilizada como estratégia de biosseguridade?",
    "options": [
        "Porque elimina completamente todas as substâncias gordurosas do colostro.",
        "Porque reduz a carga de alguns agentes infecciosos importantes, como Mycobacterium avium subsp. paratuberculosis e Salmonella spp., preservando grande parte das imunoglobulinas quando realizada corretamente.",
        "Porque esteriliza totalmente o colostro contra todos os vírus, bactérias e parasitas.",
        "Porque remove a lactose do colostro."
    ],
    "correct": 1,
    "hint": "O objetivo é reduzir a contaminação microbiana sem comprometer significativamente os anticorpos.",
    "explanation": "A pasteurização lenta do colostro (60°C por 60 minutos) pode reduzir a carga de diversos microrganismos de importância sanitária, mantendo boa parte das imunoglobulinas funcionais quando o procedimento é corretamente executado. Temperaturas mais elevadas aumentam o risco de desnaturação dessas proteínas.",
    "funFact": "A pasteurização do colostro é adotada principalmente em rebanhos com programas rigorosos de controle sanitário e deve ser realizada com equipamentos adequados."
    },

    {
    "id": 20303,
    "station": 2,
    "species": "Bovinos",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "aplicacao",
    "tags": ["plasma", "ftip", "imunidade_passiva", "alternativa_colostro"],
    "question": "Na ausência de colostro adequado, qual é o princípio que justifica o uso experimental ou emergencial de plasma bovino por via oral nas primeiras horas de vida do bezerro?",
    "options": [
        "Porque pequenas quantidades de qualquer plasma fornecem proteção completa independentemente da concentração de IgG.",
        "Porque, enquanto o intestino neonatal ainda permite absorção de macromoléculas, o fornecimento de plasma rico em imunoglobulinas pode contribuir para a transferência passiva, desde que realizado muito precocemente e seguindo protocolos específicos.",
        "Porque o plasma pode ser administrado por via subcutânea para substituir o colostro.",
        "Porque após o fechamento intestinal o plasma oral continua sendo absorvido normalmente."
    ],
    "correct": 1,
    "hint": "A efetividade depende principalmente da concentração de imunoglobulinas e do momento da administração.",
    "explanation": "O uso de plasma por via oral como alternativa ao colostro é uma estratégia restrita a situações específicas e depende da manutenção da capacidade intestinal de absorver macromoléculas nas primeiras horas de vida. Protocolos variam conforme a literatura e devem ser conduzidos sob orientação técnica.",
    "funFact": "O colostro continua sendo a melhor fonte de imunidade passiva para o recém-nascido e deve ser priorizado sempre que disponível."
    },

    {
    "id": 20304,
    "station": 2,
    "species": "all",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "caso_clinico",
    "tags": ["ftip", "auditoria", "pst", "protocolo_colostragem"],
    "question": "CASO CLÍNICO: Em uma auditoria do bezerreiro, 31,4% dos animais entre 3 e 7 dias apresentam proteína sérica total (PST) abaixo do valor de referência utilizado pela propriedade para avaliar transferência passiva. Qual deve ser a principal conduta do médico-veterinário?",
    "options": [
        "Instituir antibioticoterapia oral em todos os animais e manter o protocolo atual.",
        "Investigar imediatamente o protocolo de colostragem (tempo, volume, qualidade, método de fornecimento e higiene) e avaliar individualmente as medidas terapêuticas indicadas para os animais afetados.",
        "Substituir automaticamente todo o colostro por sucedâneo comercial.",
        "Realizar transfusão de sangue total em todos os bezerros do lote."
    ],
    "correct": 1,
    "hint": "O mais importante é identificar a causa da falha no processo para evitar novos casos.",
    "explanation": "Alta prevalência de falha na transferência de imunidade passiva exige auditoria completa do manejo do colostro, incluindo tempo de fornecimento, volume administrado, qualidade do colostro, método de administração e higiene. A necessidade de tratamentos específicos deve ser avaliada caso a caso pelo médico-veterinário.",
    "funFact": "Monitorar rotineiramente indicadores de transferência passiva é uma das ferramentas mais úteis para avaliar a eficiência do manejo neonatal em propriedades leiteiras."
    },

    { "id": 30104, "station": 3, "species": "all", "audience": "leigo", "difficulty": 1, "type": "conceitual", "tags": ["temperatura_normal", "termometro", "monitoramento"],
    "question": "❄️ Qual é a temperatura corporal normal de um bezerro ou cordeiro saudável e como o produtor pode verificar isso na fazenda?",
    "options": ["Temperatura normal entre 38,5°C e 39,5°C. Mede-se com um termômetro clínico digital introduzido cuidadosamente no reto do animal até estabilizar a leitura.", "A temperatura normal dos filhotes é a mesma dos humanos (36°C a 37°C) e só pode ser medida em laboratório com equipamentos especiais.", "Não existe temperatura padrão para filhotes. O produtor deve avaliar apenas pelo toque na orelha e na pata do animal.", "A temperatura normal de bezerros é de 42°C a 43°C. Qualquer valor abaixo disso indica problema grave que exige ação imediata."],
    "correct": 0,
    "hint": "A temperatura de ruminantes é um pouco mais alta que a humana. Um termômetro retal simples é a ferramenta mais confiável e barata para verificar se o filhote está bem.",
    "explanation": "Em bezerros e cordeiros recém-nascidos, a temperatura retal fisiológica costuma variar aproximadamente entre 38,5°C e 39,5°C. Valores abaixo de 38°C sugerem hipotermia e merecem atenção imediata. A aferição deve ser feita com termômetro digital introduzido suavemente no reto até estabilizar a leitura.",
    "funFact": "As orelhas e os membros costumam ficar frios antes mesmo de a temperatura central cair muito, sendo um sinal precoce de alerta para o produtor."
    },

    { "id": 30105, "station": 3, "species": "all", "audience": "leigo", "difficulty": 2, "type": "prevencao", "tags": ["abrigo", "capa", "lampada_infravermelha", "prevencao_frio"],
    "question": "Quais atitudes práticas do produtor ajudam diretamente a prevenir a hipotermia em bezerros e cordeiros nascidos em noites muito frias?",
    "options": ["Deixar o filhote ao relento durante a noite para que ele se adapte naturalmente ao frio do ambiente.", "Usar capas próprias para filhotes quando indicado, fornecer cama seca e limpa (palha ou maravalha) e oferecer abrigo protegido do vento e da chuva, podendo utilizar fontes seguras de aquecimento quando necessário.", "Molhar o filhote com água fria logo após o nascimento para estimular a respiração.", "Amarrar o filhote próximo à mãe para impedir que ele se movimente e gaste energia tentando se aquecer."],
    "correct": 1,
    "hint": "Evitar a perda de calor é tão importante quanto aquecer o animal. Isolamento do solo, proteção contra vento e ambiente seco fazem grande diferença.",
    "explanation": "Capas específicas podem reduzir a perda de calor, enquanto uma cama seca funciona como isolante térmico e um abrigo protegido evita vento e umidade. Fontes de aquecimento, quando utilizadas corretamente e com segurança, também auxiliam na prevenção da hipotermia neonatal.",
    "funFact": "Boa parte das perdas de calor de um recém-nascido ocorre por contato com o solo frio e úmido, motivo pelo qual uma cama seca faz tanta diferença."
    },

    { "id": 30204, "station": 3, "species": "all", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["classificacao_hipotermia", "protocolo_clinico", "hipotermia"],
    "question": "Como se classifica clinicamente a hipotermia neonatal em ovinos e bovinos e quais as condutas correspondentes a cada grau de severidade?",
    "options": ["Hipotermia é classificada apenas em 'presente ou ausente'; a conduta única é aquecimento por banho-maria a 42°C, independentemente da temperatura retal.", "Leve (38,0–38,4°C): secagem e aquecimento ambiental; Moderada (37,0–37,9°C): aquecimento externo ativo associado à oferta de colostro aquecido quando houver reflexo de sucção; Severa (abaixo de 37°C com ausência de reflexo de sucção): suporte energético por via parenteral e reaquecimento gradual, evitando alimentação oral.", "Hipotermia Grau I (abaixo de 36°C): transfusão de plasma quente IV imediata; Hipotermia Grau II (36–38°C): dexametasona IM isolada e aquecimento passivo ao sol.", "A classificação da hipotermia é feita exclusivamente pelo nível de glicemia sérica, sem relação com a temperatura corporal."],
    "correct": 1,
    "hint": "Além da temperatura retal, o reflexo de sucção ajuda a decidir se o filhote pode receber alimento por via oral com segurança.",
    "explanation": "Na prática clínica, a temperatura corporal e a presença do reflexo de sucção orientam a conduta. Filhotes sem reflexo de sucção apresentam alto risco de aspiração caso recebam alimento por via oral, sendo preferível estabilização e suporte por via apropriada antes da alimentação.",
    "funFact": "O desaparecimento do reflexo de sucção costuma indicar comprometimento metabólico importante e pior prognóstico se não houver intervenção rápida."
    },

    { "id": 30205, "station": 3, "species": "all", "audience": "estudante", "difficulty": 2, "type": "interpretacao", "tags": ["hipoglicemia", "termogenese", "gordura_marrom", "hipotermia"],
    "question": "Por qual razão a hipoglicemia é uma consequência frequente da hipotermia severa e prolongada em neonatos ruminantes?",
    "options": ["Porque o frio inibe diretamente a produção de insulina pelo pâncreas, causando hiperglicemia que depois evolui para hipoglicemia.", "Porque os estoques limitados de glicogênio hepático e as reservas energéticas utilizadas para produção de calor são rapidamente consumidos durante a tentativa de manter a temperatura corporal.", "Porque a hipotermia bloqueia completamente a absorção intestinal de glicose por 72 horas após o nascimento.", "Porque o frio intenso provoca hemólise e as hemácias passam a consumir grandes quantidades de glicose."],
    "correct": 1,
    "hint": "Para produzir calor, o organismo precisa gastar energia, e os estoques do recém-nascido são pequenos.",
    "explanation": "Neonatos possuem reservas limitadas de glicogênio e dependem rapidamente da ingestão de colostro para manter o equilíbrio energético. Quando permanecem expostos ao frio intenso, o consumo dessas reservas aumenta muito, favorecendo o desenvolvimento de hipoglicemia.",
    "funFact": "Filhotes que recebem colostro precocemente têm mais energia disponível para produzir calor e resistir às baixas temperaturas."
    },

    { "id": 30303, "station": 3, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["afterdrop", "reaquecimento_gradual", "hipotermia", "fluidoterapia"],
    "question": "CASO CLÍNICO: Após administração de suporte energético apropriado em um bezerro com hipotermia severa (temperatura retal 34,2°C), inicia-se o reaquecimento externo. Qual estratégia é considerada mais adequada e qual fenômeno fisiopatológico justifica evitar reaquecimento periférico muito agressivo?",
    "options": ["O reaquecimento deve ser o mais rápido possível (acima de 3°C/h), pois não há riscos cardiovasculares relevantes.", "Realizar reaquecimento gradual e monitorado, utilizando fontes seguras de calor e suporte clínico. O reaquecimento periférico excessivamente rápido pode favorecer o fenômeno de afterdrop, relacionado ao retorno de sangue frio das extremidades para a circulação central.", "Colocar imediatamente o animal em banho de água a 45°C por 30 minutos seguido de exposição ao sol.", "Padronizar reaquecimento de 2°C/h em todos os casos, sendo o principal risco apenas a desidratação cutânea."],
    "correct": 1,
    "hint": "A redistribuição brusca do sangue frio periférico pode comprometer ainda mais a temperatura central e a estabilidade cardiovascular.",
    "explanation": "O reaquecimento deve ser progressivo e acompanhado de suporte adequado. O fenômeno conhecido como afterdrop corresponde à queda adicional da temperatura central após mobilização do sangue frio periférico para a circulação central, justificando cautela durante o processo.",
    "funFact": "O conceito de afterdrop foi inicialmente estudado em vítimas humanas de hipotermia e passou posteriormente a orientar protocolos também na medicina veterinária."
    },

    { "id": 30304, "station": 3, "species": "Ovinos", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["glicose", "intraperitoneal", "cordeiro", "emergencia"],
    "question": "Em cordeiros com hipotermia severa e ausência de reflexo de sucção, qual princípio deve orientar o fornecimento de suporte energético antes do reaquecimento completo?",
    "options": ["Sempre administrar qualquer solução concentrada por qualquer via disponível, independentemente da temperatura da solução ou do estado clínico.", "Fornecer suporte energético por via apropriada conforme o protocolo clínico adotado, utilizando soluções aquecidas próximas à temperatura corporal e respeitando técnica asséptica e treinamento adequado para a via escolhida.", "Administrar apenas água morna por via oral, mesmo sem reflexo de sucção, pois não existe risco de aspiração.", "Aguardar o animal recuperar espontaneamente a temperatura corporal antes de qualquer intervenção energética."],
    "correct": 1,
    "hint": "Além do tipo de solução, a técnica correta, a temperatura do fluido e a avaliação clínica do paciente são fundamentais para um tratamento seguro.",
    "explanation": "Em cordeiros gravemente hipotérmicos, o suporte energético deve preceder ou acompanhar o reaquecimento e ser realizado por profissionais treinados ou conforme protocolos validados, utilizando soluções aquecidas e respeitando critérios técnicos para a via de administração escolhida.",
    "funFact": "Em sistemas intensivos de produção ovina, o treinamento da equipe para reconhecimento precoce da hipotermia reduz significativamente a mortalidade neonatal."
    },
    {
    "id": 40102,
    "station": 4,
    "species": "all",
    "audience": "leigo",
    "difficulty": 1,
    "type": "prevencao",
    "tags": ["higiene_baia", "pressao_infecciosa", "limpeza", "umbigo"],
    "question": "🦠 Por que é tão importante trocar e limpar a cama (palha, serragem) da baia onde os filhotes ficam logo após o nascimento?",
    "options": [
        "Apenas por questões estéticas e de apresentação da propriedade. A sujeira acumulada no chão não afeta a saúde dos filhotes.",
        "Porque fezes e matéria orgânica acumuladas aumentam muito a quantidade de bactérias e outros microrganismos no ambiente. Filhotes recém-nascidos ficam mais expostos a infecções como diarreia, onfalite (infecção do umbigo) e outras doenças.",
        "Porque a palha velha produz gases que fazem os filhotes espirrar, o que é desconfortável mas sem risco à saúde.",
        "Porque os filhotes jovens comem a cama do chão e podem entupir o estômago com material indigestível."
    ],
    "correct": 1,
    "hint": "Filhotes recém-nascidos ainda estão desenvolvendo sua própria imunidade e dependem de um ambiente limpo para reduzir o contato com agentes infecciosos.",
    "explanation": "A cama úmida e contaminada favorece a multiplicação de bactérias, vírus e outros agentes capazes de causar doenças. Além da ingestão acidental desses microrganismos, o umbigo recém-cortado também pode servir como porta de entrada para infecções. A troca frequente da cama e a higiene adequada reduzem significativamente o risco de enfermidades neonatais.",
    "funFact": "A limpeza do ambiente de maternidade é considerada uma das medidas mais eficazes e de menor custo para reduzir doenças em recém-nascidos."
    },
    {
    "id": 40103,
    "station": 4,
    "species": "all",
    "audience": "leigo",
    "difficulty": 2,
    "type": "aplicacao",
    "tags": ["artrite_septica", "junta_boba", "umbigo", "iodo"],
    "question": "Um produtor percebe que um bezerro de 2 semanas começou a mancar, apresenta uma articulação inchada e quente e também está com febre. O que isso pode indicar e qual a possível relação com o umbigo?",
    "options": [
        "O bezerro apenas se machucou ao correr no pasto e normalmente melhora sozinho com repouso.",
        "Uma infecção que entrou pelo umbigo pode ter alcançado a corrente sanguínea e se instalado na articulação, causando artrite séptica. O animal deve ser avaliado rapidamente por um médico-veterinário.",
        "Juntas inchadas em filhotes são sempre causadas por deficiência de vitamina D e falta de exposição ao sol.",
        "O animal ingeriu uma planta tóxica que provoca inchaço nas articulações e não há relação com o período neonatal."
    ],
    "correct": 1,
    "hint": "O umbigo recém-nascido pode servir como porta de entrada para bactérias quando não recebe manejo adequado.",
    "explanation": "A onfalite pode permitir que bactérias alcancem a circulação sanguínea e se disseminem para diferentes órgãos, incluindo as articulações, provocando artrite séptica. O tratamento precoce aumenta as chances de recuperação e reduz o risco de sequelas permanentes.",
    "funFact": "A imersão adequada do umbigo em solução antisséptica logo após o nascimento ajuda a reduzir o risco de infecções locais e sistêmicas."
    },
    {
    "id": 40203,
    "station": 4,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 2,
    "type": "interpretacao",
    "tags": ["diarreia", "etiologia", "ecoli", "faixa_etaria"],
    "question": "O diagnóstico diferencial das diarreias neonatais leva em consideração a idade do bezerro. Qual agente está mais frequentemente associado aos casos entre 1 e 4 dias de vida?",
    "options": [
        "Eimeria bovis (coccidiose bovina), normalmente observada em animais mais velhos.",
        "Escherichia coli enterotoxigênica (ETEC) com fímbria K99/F5, importante causa de diarreia nas primeiras 72 a 96 horas de vida.",
        "Rotavírus bovino tipo A, cuja ocorrência é mais comum em animais entre aproximadamente 5 e 14 dias de idade.",
        "Cryptosporidium parvum, frequentemente associado a bezerros com cerca de 5 a 15 dias de vida."
    ],
    "correct": 1,
    "hint": "Alguns patógenos aproveitam características específicas do intestino do neonato logo após o nascimento.",
    "explanation": "A ETEC portadora da fímbria K99/F5 consegue aderir ao epitélio intestinal de bezerros muito jovens e produzir enterotoxinas que levam à diarreia intensa. Conforme o intestino amadurece, essa capacidade de colonização diminui, enquanto outros agentes passam a ser mais frequentes.",
    "funFact": "A vacinação das matrizes no pré-parto e a oferta adequada de colostro ajudam a fornecer anticorpos contra cepas de ETEC importantes para a prevenção da doença."
    },
    {
    "id": 40204,
    "station": 4,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 3,
    "type": "caso_clinico",
    "tags": ["clostridiose", "clostridium_perfringens", "enterite_hemorragica"],
    "question": "Qual é a manifestação clínica típica e o principal mecanismo fisiopatológico da enterotoxemia causada por Clostridium perfringens tipo C em bezerros neonatos?",
    "options": [
        "Diarreia crônica por destruição lenta das microvilosidades intestinais durante várias semanas.",
        "Enterite hemorrágica aguda, frequentemente de evolução muito rápida, causada principalmente pela toxina beta, que provoca necrose intensa da mucosa intestinal.",
        "Timpanismo ruminal por fermentação excessiva da lactose no rúmen imaturo.",
        "Artrite migratória seguida de meningoencefalite progressiva como apresentação clínica predominante."
    ],
    "correct": 1,
    "hint": "Essa doença costuma evoluir rapidamente e pode causar morte antes mesmo que sinais clínicos importantes sejam percebidos.",
    "explanation": "O Clostridium perfringens tipo C produz especialmente a toxina beta, responsável por intensa necrose e hemorragia do intestino delgado. Em muitos casos, a evolução é fulminante. A vacinação das matrizes durante o período recomendado e a adequada ingestão de colostro pelos recém-nascidos são importantes medidas preventivas.",
    "funFact": "A suscetibilidade dos neonatos é favorecida porque a tripsina intestinal, capaz de inativar parte da toxina beta, ainda apresenta atividade reduzida nos primeiros dias de vida."
    },

    {
    "id": 40303,
    "station": 4,
    "species": "Bovinos",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "aplicacao",
    "tags": ["contaminacao_colostro", "higiene", "ftip", "bacterias"],
    "question": "Bezerros alimentados com colostro altamente contaminado por bactérias podem apresentar menor eficiência de transferência de imunidade passiva mesmo quando o colostro possui alta concentração de IgG. Qual mecanismo melhor explica esse fenômeno?",
    "options": [
        "As bactérias degradam completamente todas as imunoglobulinas presentes no colostro antes da absorção intestinal.",
        "Altas cargas bacterianas podem interferir na absorção intestinal das imunoglobulinas e estão associadas à redução da eficiência da transferência passiva, reforçando a importância da higiene durante coleta, armazenamento e fornecimento do colostro.",
        "As bactérias competem diretamente pelos receptores FcRn dos enterócitos, bloqueando fisicamente toda a absorção de IgG.",
        "Não existe evidência de que a contaminação bacteriana do colostro interfira na transferência de imunidade passiva."
    ],
    "correct": 1,
    "hint": "Além da quantidade de IgG, a qualidade microbiológica do colostro também influencia o sucesso da transferência passiva.",
    "explanation": "Colostros excessivamente contaminados estão associados à menor eficiência de absorção de imunoglobulinas e ao aumento do risco de doenças neonatais. Por isso, boas práticas de higiene na ordenha, armazenamento, transporte e administração do colostro são fundamentais para o sucesso da colostragem.",
    "funFact": "Programas de qualidade de colostro normalmente monitoram tanto o teor de IgG (ou Brix) quanto a carga bacteriana da amostra."
    },
    {
    "id": 40304,
    "station": 4,
    "species": "Bovinos",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "caso_clinico",
    "tags": ["artrite_septica", "antibioticoterapia", "prognostico", "lavagem_articular"],
    "question": "CASO CLÍNICO: Bezerro de 18 dias apresenta artrite séptica confirmada em uma articulação do membro pélvico, com distensão capsular, febre e líquido sinovial purulento à punção. Qual abordagem terapêutica é mais apropriada?",
    "options": [
        "Antibioticoterapia oral curta e repouso, pois a maioria dos casos evolui favoravelmente sem outras intervenções.",
        "Associação de antibioticoterapia sistêmica adequada, controle da dor e inflamação e, quando indicado após avaliação veterinária, procedimentos como lavagem articular ou drenagem, lembrando que o prognóstico pode ser reservado dependendo da gravidade e do tempo de evolução.",
        "Uso exclusivo de corticosteroides em altas doses para controlar a inflamação articular.",
        "Amputação imediata do membro afetado como primeira escolha terapêutica."
    ],
    "correct": 1,
    "hint": "O controle da infecção costuma exigir abordagem multimodal e rápida para reduzir danos permanentes à articulação.",
    "explanation": "A artrite séptica neonatal é uma emergência clínica. O tratamento geralmente inclui antibioticoterapia sistêmica baseada na avaliação do médico-veterinário, analgesia e, em muitos casos, lavagem ou drenagem da articulação para reduzir a carga infecciosa e inflamatória. O prognóstico depende da rapidez do diagnóstico, da articulação acometida e da extensão das lesões.",
    "funFact": "Quanto mais cedo o tratamento é iniciado, maiores são as chances de preservar a função articular e reduzir sequelas permanentes."
    },

    {
    "id": 50103,
    "station": 5,
    "species": "Bovinos",
    "audience": "leigo",
    "difficulty": 2,
    "type": "conceitual",
    "tags": ["cetose", "ben", "alimentacao", "reconhecimento"],
    "question": "🌿 Como o produtor percebe que o emagrecimento de uma vaca nas primeiras semanas após o parto está passando dos limites e se tornando perigoso?",
    "options": [
        "Quando a vaca aumenta o consumo de ração e bebe muito mais água que o normal. Esses sinais indicam metabolismo acelerado e saudável.",
        "Quando a vaca emagrece visivelmente com costelas salientes, apresenta um odor adocicado no hálito (cheiro semelhante ao de acetona), fica apática e reduz o consumo de alimento. Isso pode indicar que o corpo está mobilizando gordura em excesso, situação compatível com cetose.",
        "Quando a vaca produz mais leite que o normal nas primeiras 2 semanas. A hiperprodução indica metabolismo em ótimo funcionamento.",
        "Quando as fezes ficam muito firmes e secas. Isso indica que o animal está aproveitando toda a energia da ração de forma eficiente."
    ],
    "correct": 1,
    "hint": "O corpo da vaca que não tem energia suficiente começa a utilizar suas reservas de gordura. Esse processo produz corpos cetônicos que podem alterar até o odor do hálito.",
    "explanation": "Quando a vaca gasta mais energia produzindo leite do que consegue ingerir, ela entra em Balanço Energético Negativo (BEN). O organismo mobiliza gordura corporal e produz corpos cetônicos, incluindo acetona. O odor característico no hálito, associado à perda de condição corporal, redução do apetite e apatia, é sugestivo de cetose. O diagnóstico deve ser confirmado por avaliação clínica e, quando possível, pela mensuração de BHB.",
    "funFact": "Em alguns casos de cetose clínica, o odor semelhante ao de acetona pode ser percebido até mesmo no leite e no hálito do animal."
    },
    {
    "id": 50104,
    "station": 5,
    "species": "Bovinos",
    "audience": "leigo",
    "difficulty": 1,
    "type": "conceitual",
    "tags": ["hipocalcemia", "calcio", "febre_leite", "lactacao"],
    "question": "🐄 Por que vacas que produzem muito leite podem cair, tremer e ficar paralisadas logo depois do parto, mesmo estando em clima quente e sem infecção?",
    "options": [
        "Porque o esforço de produzir muito leite aumenta a temperatura do úbere, causando uma febre localizada que paralisa os músculos.",
        "Porque a produção intensa de leite retira cálcio do sangue da vaca mais rápido do que o organismo consegue repor. Com hipocalcemia, músculos e nervos deixam de funcionar adequadamente, causando tremores, fraqueza e dificuldade para se levantar.",
        "Porque o leite produzido em grandes quantidades azeda dentro do úbere, gerando toxinas que causam paralisia muscular progressiva.",
        "Porque vacas que produzem muito leite sempre desenvolvem infecção bacteriana no sangue. Os tremores são sintomas dessa infecção."
    ],
    "correct": 1,
    "hint": "O cálcio participa da contração muscular e da transmissão nervosa. Sua queda no sangue afeta todo o organismo.",
    "explanation": "No início da lactação, grandes quantidades de cálcio são direcionadas para a produção de leite. Se os mecanismos de mobilização óssea e absorção intestinal não responderem rapidamente, ocorre hipocalcemia. Os sinais incluem fraqueza, tremores, dificuldade para permanecer em estação e, em casos graves, decúbito e risco de comprometimento cardiovascular.",
    "funFact": "Apesar do nome popular 'Febre do Leite', a maioria das vacas com hipocalcemia apresenta temperatura corporal normal ou discretamente reduzida, e não febre verdadeira."
    },
    {
    "id": 50203,
    "station": 5,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 3,
    "type": "interpretacao",
    "tags": ["cetose_tipo1", "cetose_tipo2", "ben", "lipidose_hepatica"],
    "question": "Qual a principal diferença fisiopatológica entre a Cetose Tipo I (cetose de subnutrição) e a Cetose Tipo II (cetose da vaca gorda) em bovinos leiteiros?",
    "options": [
        "A cetose tipo I ocorre exclusivamente em primíparas magras no pré-parto; a cetose tipo II afeta apenas vacas pluríparas com baixo ECC no pós-parto tardio.",
        "A cetose tipo I resulta principalmente de BEN por ingestão energética insuficiente em vacas com ECC adequado ou baixo, geralmente com pouca lipidose hepática; a cetose tipo II está associada à intensa lipomobilização de vacas com ECC elevado ao parto, favorecendo lipidose hepática e comprometimento da gliconeogênese.",
        "A cetose tipo I responde exclusivamente ao propilenoglicol VO; a cetose tipo II é indiferente a qualquer precursor glicogênico e exige insulinoterapia intravenosa como tratamento exclusivo.",
        "Não há distinção clínica ou fisiopatológica entre cetose tipo I e tipo II."
    ],
    "correct": 1,
    "hint": "O escore corporal antes do parto influencia fortemente o mecanismo que leva à cetose.",
    "explanation": "Na Cetose Tipo I predomina a deficiência de aporte energético diante da alta demanda da lactação. Já na Tipo II ocorre intensa mobilização de gordura em vacas excessivamente condicionadas ao parto, favorecendo lipidose hepática e reduzindo a capacidade do fígado de realizar gliconeogênese.",
    "funFact": "Animais com cetose associada à lipidose hepática apresentam maior risco de desenvolver outras doenças metabólicas no início da lactação."
    },
    {
    "id": 50204,
    "station": 5,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 2,
    "type": "aplicacao",
    "tags": ["bhb", "cetose_subclinica", "monitoramento", "rebanho"],
    "question": "Em um programa de monitoramento de cetose subclínica em rebanho leiteiro, qual a meta de prevalência (BHB ≥ 1,2 mmol/L) considerada aceitável internacionalmente na 1ª e 2ª semana pós-parto?",
    "options": [
        "Prevalência de até 50% das vacas na 1ª semana é considerada fisiologicamente normal em rebanhos de alta produção.",
        "Prevalência inferior a 15% na 1ª semana e inferior a 10% na 2ª semana pós-parto são metas amplamente utilizadas como referência para bom controle do problema no rebanho.",
        "O valor de corte clinicamente relevante é apenas BHB ≥ 2,5 mmol/L.",
        "A cetose subclínica não apresenta impacto produtivo nem reprodutivo documentado."
    ],
    "correct": 1,
    "hint": "Mesmo sem sinais clínicos evidentes, a cetose subclínica pode causar perdas econômicas importantes.",
    "explanation": "Diversos programas internacionais utilizam como referência prevalência inferior a 15% na primeira semana e inferior a 10% na segunda semana pós-parto para animais com BHB ≥ 1,2 mmol/L. Valores superiores sugerem necessidade de revisão do manejo nutricional da transição.",
    "funFact": "Grande parte das perdas econômicas relacionadas à cetose ocorre justamente nos casos subclínicos, que passam despercebidos sem monitoramento."
    },
    {
    "id": 50302,
    "station": 5,
    "species": "Bovinos",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "caso_clinico",
    "tags": ["dae", "ben", "atonia", "hipocalcemia"],
    "question": "Qual a cadeia fisiopatológica que conecta o Balanço Energético Negativo (BEN) pós-parto ao Deslocamento de Abomaso à Esquerda (DAE) e quais fatores nutricionais aumentam esse risco?",
    "options": [
        "O BEN eleva diretamente o pH ruminal, promovendo deslocamento mecânico do abomaso.",
        "O BEN favorece hipercetonemia e frequentemente está associado à hipocalcemia subclínica, reduzindo a motilidade gastrointestinal. O abomaso hipomotil acumula gás e pode deslocar-se para o lado esquerdo, especialmente após o esvaziamento uterino. Fatores como ECC elevado ao parto, baixo teor de fibra fisicamente efetiva e manejo inadequado da dieta de transição aumentam esse risco.",
        "O deslocamento é causado exclusivamente pela gestação gemelar.",
        "O BEN provoca hiperglicemia persistente que gera excesso de ácido clorídrico e deslocamento do abomaso."
    ],
    "correct": 1,
    "hint": "A associação entre hipomotilidade do abomaso e espaço criado após o parto favorece o deslocamento.",
    "explanation": "O BEN, associado à hipercetonemia e frequentemente à hipocalcemia subclínica, reduz a motilidade do trato gastrointestinal. O acúmulo de gás em um abomaso hipomotil facilita sua migração para o lado esquerdo após o parto. O excesso de condição corporal e dietas de transição inadequadas aumentam significativamente esse risco.",
    "funFact": "O DAE é uma das cirurgias de campo mais frequentes em vacas leiteiras de alta produção."
    },
    {
    "id": 50303,
    "station": 5,
    "species": "Bovinos",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "aplicacao",
    "tags": ["propilenoglicol", "cetose", "gliconeogenese", "toxicidade"],
    "question": "O propileno glicol (PG) é amplamente utilizado como precursor glicogênico oral em vacas com cetose. Qual seu mecanismo de ação, dose terapêutica habitual e principal risco associado ao uso excessivo?",
    "options": [
        "O PG é convertido diretamente em imunoglobulinas pelo fígado. Dose: 500 mL/dia. Superdosagem provoca apenas diarreia leve.",
        "Após absorção, o PG é metabolizado em intermediários utilizados na gliconeogênese hepática, aumentando a disponibilidade de glicose e reduzindo a mobilização de gordura. A dose habitual é de 300 a 500 mL/dia por via oral. O uso excessivo pode causar depressão do sistema nervoso central, redução do consumo alimentar e acidose metabólica.",
        "O PG deve ser administrado em dose única de 1 litro por dia e não apresenta toxicidade conhecida.",
        "Seu mecanismo consiste apenas em eliminar corpos cetônicos pela urina e a dose segura é de 50 mL/kg."
    ],
    "correct": 1,
    "hint": "O propileno glicol atua como precursor da glicose, mas doses elevadas podem produzir efeitos adversos importantes.",
    "explanation": "O propileno glicol é rapidamente absorvido e metabolizado em compostos que alimentam a gliconeogênese hepática, aumentando a glicemia e reduzindo a lipomobilização. A administração diária de 300–500 mL por via oral é amplamente utilizada no tratamento da cetose. Superdosagens podem causar depressão do SNC, redução do apetite e distúrbios metabólicos.",
    "funFact": "O propileno glicol também é utilizado em diversas aplicações industriais e alimentícias, mas seu emprego na bovinocultura leiteira tornou-se uma das principais estratégias para controle da cetose."
    },

    {
    "id": 60103,
    "station": 6,
    "species": "all",
    "audience": "leigo",
    "difficulty": 1,
    "type": "prevencao",
    "tags": ["cadeia_frio", "vacina", "armazenamento"],
    "question": "💉 Por que é tão importante guardar as vacinas na geladeira, entre 2°C e 8°C, e evitar que elas congelem?",
    "options": [
        "Apenas para manter a aparência do produto. A temperatura não interfere na eficácia da vacina.",
        "Porque calor excessivo e congelamento podem danificar componentes da vacina e reduzir ou até eliminar sua capacidade de proteger o animal.",
        "Porque essa é apenas uma exigência burocrática de armazenamento, sem impacto prático na imunização.",
        "Porque vacinas aquecidas sempre causam alergias graves, enquanto o frio impede essas reações."
    ],
    "correct": 1,
    "hint": "As vacinas dependem da integridade de seus componentes para estimular corretamente o sistema imunológico.",
    "explanation": "A manutenção da cadeia de frio é essencial para preservar a eficácia das vacinas. Exposição a temperaturas elevadas ou congelamento pode danificar seus componentes, tornando a imunização menos eficiente ou até ineficaz, mesmo que o produto mantenha aparência normal.",
    "funFact": "Falhas no armazenamento são uma das causas mais comuns de perda de eficácia vacinal em programas de vacinação animal."
    },

    {
    "id": 60104,
    "station": 6,
    "species": "all",
    "audience": "leigo",
    "difficulty": 2,
    "type": "prevencao",
    "tags": ["tetano", "umbigo", "vacina", "colostro"],
    "question": "Por que vacinar a mãe contra o tétano antes do parto ajuda a proteger o filhote recém-nascido?",
    "options": [
        "Porque a vacina passa diretamente para o filhote através do cordão umbilical durante o parto.",
        "Porque a mãe produz anticorpos que passam para o filhote pelo colostro, oferecendo proteção nos primeiros meses de vida.",
        "Porque o tétano foi eliminado do Brasil e a vacinação serve apenas para manter um protocolo tradicional.",
        "Porque a vacinação protege apenas a mãe durante o parto, sem beneficiar o filhote."
    ],
    "correct": 1,
    "hint": "Nos ruminantes, a principal transferência de anticorpos ocorre pelo colostro.",
    "explanation": "A vacinação da mãe estimula a produção de anticorpos contra o tétano, que se concentram no colostro. Quando o recém-nascido mama logo após o parto, absorve esses anticorpos e recebe proteção passiva enquanto seu próprio sistema imunológico ainda está em desenvolvimento.",
    "funFact": "A desinfecção adequada do umbigo e a ingestão precoce de colostro são medidas complementares importantes para reduzir o risco de infecções neonatais."
    },

    {
    "id": 60202,
    "station": 6,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 2,
    "type": "prevencao",
    "tags": ["vacina_viva", "gestacao", "bvdv"],
    "question": "Por que algumas vacinas vivas modificadas exigem cautela ou podem ser contraindicadas durante a gestação de bovinos?",
    "options": [
        "Porque sempre provocam reações anafiláticas graves no feto, independentemente da vacina utilizada.",
        "Porque determinadas vacinas vivas modificadas podem atravessar a barreira placentária ou afetar o desenvolvimento fetal, dependendo do agente utilizado e do estágio da gestação, motivo pelo qual devem ser empregadas conforme as recomendações do fabricante e do médico-veterinário.",
        "Porque vacinas vivas modificadas são totalmente seguras em qualquer fase da gestação e nunca causam problemas reprodutivos.",
        "Porque animais vacinados eliminam obrigatoriamente o agente vacinal pelas vias respiratórias durante semanas."
    ],
    "correct": 1,
    "hint": "Nem todas as vacinas vivas possuem as mesmas indicações para fêmeas gestantes.",
    "explanation": "Algumas vacinas vivas modificadas podem representar riscos durante determinadas fases da gestação, dependendo do agente vacinal e das características do produto. Por isso, sua utilização deve seguir rigorosamente as recomendações técnicas do fabricante e a orientação do médico-veterinário responsável pelo programa sanitário.",
    "funFact": "Antes de incluir uma vacina em um protocolo reprodutivo, é importante verificar se ela possui indicação específica para uso em animais gestantes."
    },

    {
    "id": 60203,
    "station": 6,
    "species": "all",
    "audience": "estudante",
    "difficulty": 2,
    "type": "aplicacao",
    "tags": ["anticorpos_maternos", "janela_imunologica", "timing_vacinal"],
    "question": "Como os anticorpos recebidos pelo colostro podem influenciar o momento ideal para iniciar a vacinação de bezerros e cordeiros?",
    "options": [
        "Eles desaparecem em poucos dias, por isso a vacinação deve começar ainda na primeira semana de vida.",
        "Os anticorpos maternos diminuem gradualmente ao longo das primeiras semanas e podem interferir na resposta a algumas vacinas; por isso, o início do protocolo costuma ser planejado para equilibrar proteção e resposta imunológica.",
        "Os anticorpos maternos permanecem em níveis protetores durante todo o primeiro ano de vida, tornando desnecessária qualquer vacinação nesse período.",
        "Os anticorpos recebidos pelo colostro não interferem na resposta às vacinas."
    ],
    "correct": 1,
    "hint": "Existe um período em que a proteção passiva diminui progressivamente enquanto o sistema imune próprio do animal assume maior importância.",
    "explanation": "Os anticorpos maternos adquiridos pelo colostro oferecem proteção inicial, mas também podem neutralizar alguns antígenos vacinais. Por isso, os calendários vacinais são planejados para reduzir essa interferência e estimular uma resposta imunológica mais eficiente, conforme a doença e a vacina utilizada.",
    "funFact": "A idade ideal para vacinação pode variar entre doenças e produtos comerciais, motivo pelo qual seguir o protocolo recomendado é fundamental."
    },

    {
    "id": 60303,
    "station": 6,
    "species": "Bovinos",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "aplicacao",
    "tags": ["mannheimia", "pneumonia_enzootica", "complexo_respiratorio", "timing_vacinal"],
    "question": "Na prevenção do Complexo Respiratório Bovino, qual é o papel da Mannheimia haemolytica e por que a vacinação costuma ser planejada antes de eventos estressantes, como o desmame?",
    "options": [
        "É sempre o agente primário da doença e deve ser combatida apenas com vacinação intranasal realizada no próprio dia do desmame.",
        "É frequentemente um agente oportunista associado ao Complexo Respiratório Bovino. A vacinação antes de eventos estressantes permite que o animal desenvolva resposta imune antes do período de maior risco de exposição.",
        "Provoca apenas pleurite sem acometer o parênquima pulmonar e, por isso, a vacinação é indicada somente após episódios clínicos.",
        "Sua vacina não pode ser administrada junto com outras vacinas respiratórias devido a antagonismo imunológico obrigatório."
    ],
    "correct": 1,
    "hint": "O estresse favorece a ocorrência do Complexo Respiratório Bovino, tornando importante que a imunidade esteja estabelecida previamente.",
    "explanation": "Mannheimia haemolytica é considerada um importante agente bacteriano associado ao Complexo Respiratório Bovino, frequentemente após fatores predisponentes como infecções virais e estresse. Programar a vacinação antes de desmame, transporte ou reagrupamento permite tempo para desenvolvimento da resposta imune antes do período de maior desafio sanitário.",
    "funFact": "A redução do estresse e o bom manejo ambiental são medidas que complementam a vacinação na prevenção das doenças respiratórias."
    },

    {
    "id": 60304,
    "station": 6,
    "species": "Ovinos",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "aplicacao",
    "tags": ["clostridioses", "bacterina_toxoide", "ovinos", "primovacinacao"],
    "question": "Em um rebanho ovino sem histórico de vacinação, qual estratégia é normalmente adotada para estabelecer imunidade das matrizes com bacterinas-toxoides contra clostridioses antes do parto?",
    "options": [
        "Aplicar apenas uma dose única durante toda a vida reprodutiva, pois a proteção é permanente.",
        "Realizar a primovacinação conforme o protocolo do fabricante, geralmente composta por duas doses com intervalo recomendado, seguida de reforços periódicos planejados para manter altos títulos de anticorpos antes do parto.",
        "Aplicar três doses obrigatórias com intervalo fixo de 14 dias para todas as propriedades, independentemente do produto utilizado.",
        "Vacinar apenas os cordeiros, pois a imunização das matrizes não contribui para a proteção passiva dos recém-nascidos."
    ],
    "correct": 1,
    "hint": "O objetivo é estimular memória imunológica e aumentar os anticorpos presentes no colostro.",
    "explanation": "Em animais sem vacinação prévia, costuma-se realizar uma série inicial de doses conforme orientação do fabricante, seguida por reforços periódicos. Quando aplicados antes do parto, esses reforços aumentam a concentração de anticorpos no colostro, contribuindo para a proteção passiva dos cordeiros recém-nascidos.",
    "funFact": "A vacinação das matrizes é uma das principais estratégias para reduzir casos precoces de clostridioses em cordeiros por meio da transferência de anticorpos pelo colostro."
    },

    {
    "id": 70102,
    "station": 7,
    "species": "all",
    "audience": "leigo",
    "difficulty": 1,
    "type": "conceitual",
    "tags": ["registros", "gestao", "dados", "manejo"],
    "question": "📊 Por que é importante o produtor anotar em um caderno ou aplicativo as datas de parto, tratamentos, vacinas e peso dos filhotes nascidos na fazenda?",
    "options": [
        "Para cumprir exigências burocráticas do governo. Os registros não têm utilidade prática no dia a dia da propriedade.",
        "Porque os registros ajudam o produtor e o veterinário a identificar padrões de doenças e mortalidade, acompanhar o desempenho dos animais e tomar decisões de manejo baseadas em informações confiáveis.",
        "Os registros só são importantes para fazendas que exportam animais ou produtos para outros países.",
        "Anotar informações apenas aumenta a burocracia e dificulta o trabalho dos colaboradores."
    ],
    "correct": 1,
    "hint": "Quem registra informações consegue comparar resultados ao longo do tempo e perceber problemas que passariam despercebidos apenas pela memória.",
    "explanation": "Registros como data de nascimento, peso ao nascer, colostragem, tratamentos, vacinação e ocorrência de doenças permitem acompanhar o desempenho dos animais e avaliar a eficiência dos protocolos adotados. Essas informações auxiliam na tomada de decisões técnicas e econômicas e facilitam o acompanhamento veterinário.",
    "funFact": "Muitas propriedades identificam surtos de doenças ou falhas de manejo mais rapidamente graças à análise de registros simples feitos diariamente."
    },

    {
    "id": 70103,
    "station": 7,
    "species": "Bovinos",
    "audience": "leigo",
    "difficulty": 2,
    "type": "interpretacao",
    "tags": ["periodo_servico", "reproducao", "eficiencia", "indicador"],
    "question": "O que é o período de serviço de uma vaca e por que ele é importante para a eficiência reprodutiva da fazenda?",
    "options": [
        "É todo o período em que a vaca permanece produzindo leite durante a lactação.",
        "É o intervalo entre o parto e a nova concepção da vaca. Quando esse período se prolonga, aumenta o intervalo entre partos e reduz a eficiência reprodutiva do rebanho.",
        "É o tempo em que a vaca permanece no período seco antes do próximo parto.",
        "É o número de inseminações realizadas até a confirmação da gestação."
    ],
    "correct": 1,
    "hint": "O período de serviço termina quando a vaca fica prenhe novamente após o parto.",
    "explanation": "O período de serviço corresponde ao intervalo entre o parto e a nova concepção. Quando ele aumenta excessivamente, o intervalo entre partos tende a se prolongar, reduzindo a eficiência reprodutiva e afetando o planejamento produtivo da propriedade.",
    "funFact": "Problemas nutricionais e doenças do pós-parto estão entre os fatores que mais contribuem para o aumento do período de serviço."
    },

    {
    "id": 70203,
    "station": 7,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 2,
    "type": "calculo",
    "tags": ["roi", "custo_beneficio", "gestao", "colostragem"],
    "question": "Um produtor deseja avaliar financeiramente a implantação de um protocolo de colostragem que custa R$ 8,00 por bezerro. Qual é a forma mais adequada de analisar esse investimento?",
    "options": [
        "Justificar apenas pelo valor emocional de evitar mortes, sem realizar cálculos econômicos.",
        "Comparar o custo total do protocolo com a redução esperada das perdas por mortalidade e estimar o retorno econômico obtido com os animais preservados.",
        "Afirmar que investimentos em prevenção não permitem cálculo de retorno financeiro.",
        "Eliminar etapas importantes do protocolo apenas para reduzir custos, sem avaliar o impacto sobre os resultados."
    ],
    "correct": 1,
    "hint": "Uma análise de custo-benefício compara quanto se investe com quanto se deixa de perder ou passa a ganhar.",
    "explanation": "A avaliação econômica deve considerar o investimento necessário para implantar o protocolo e compará-lo com a redução das perdas esperadas. Essa abordagem permite calcular indicadores como economia obtida, retorno do investimento (ROI) e viabilidade financeira da medida preventiva.",
    "funFact": "Na medicina veterinária preventiva, pequenas reduções na mortalidade neonatal podem representar ganhos econômicos expressivos ao longo do tempo."
    },

    {
    "id": 70204,
    "station": 7,
    "species": "Bovinos",
    "audience": "estudante",
    "difficulty": 2,
    "type": "interpretacao",
    "tags": ["indicadores_colostragem", "auditoria", "pst", "brix"],
    "question": "Durante uma auditoria de um protocolo de colostragem, quais indicadores ajudam a avaliar se o manejo está sendo executado adequadamente?",
    "options": [
        "Peso ao nascer, raça do animal e custo da alimentação.",
        "Avaliação da transferência de imunidade passiva por proteínas séricas totais (PST) ou método equivalente, proporção de animais que recebem colostro precocemente e monitoramento da qualidade do colostro por refratômetro Brix ou método validado.",
        "Número de ordenhas diárias das vacas e temperatura ambiente da maternidade.",
        "Peso das bezerras aos 30 dias e incidência de pneumonia após os 60 dias."
    ],
    "correct": 1,
    "hint": "Um bom protocolo avalia tanto a qualidade do colostro quanto se ele foi fornecido corretamente e se houve transferência adequada de imunidade.",
    "explanation": "Auditorias de colostragem costumam avaliar indicadores relacionados à qualidade do colostro, ao momento do fornecimento e ao sucesso da transferência de imunidade passiva para os neonatos. Esses parâmetros permitem identificar pontos de melhoria no manejo.",
    "funFact": "O refratômetro Brix tornou-se uma das ferramentas mais utilizadas em fazendas leiteiras para avaliar rapidamente a qualidade do colostro."
    },

    {
    "id": 70303,
    "station": 7,
    "species": "all",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "caso_clinico",
    "tags": ["epidemiologia", "surto_diarreia", "auditoria", "causa_raiz"],
    "question": "Você é chamado para investigar um surto de diarreia neonatal em um bezerreiro. Qual abordagem epidemiológica é mais apropriada para identificar possíveis fatores envolvidos?",
    "options": [
        "Coletar amostras de poucos animais e aguardar exclusivamente o resultado laboratorial antes de revisar qualquer manejo.",
        "Caracterizar o padrão epidemiológico do surto, revisar indicadores do manejo neonatal e de colostragem, avaliar as condições ambientais e coletar amostras apropriadas para investigação etiológica antes de integrar todas as informações na tomada de decisão.",
        "Instituir antibioticoterapia em massa para todos os animais imediatamente, independentemente da provável causa.",
        "Recomendar o descarte imediato de todos os animais afetados antes de realizar qualquer investigação."
    ],
    "correct": 1,
    "hint": "A investigação epidemiológica combina informações clínicas, de manejo, ambientais e laboratoriais.",
    "explanation": "Uma investigação adequada envolve descrever o padrão do surto, revisar práticas de manejo e biosseguridade, avaliar fatores ambientais e coletar amostras para diagnóstico complementar quando indicado. A integração dessas informações auxilia na identificação dos fatores associados ao problema e orienta medidas corretivas.",
    "funFact": "Em muitos surtos neonatais, a análise dos registros de manejo fornece pistas importantes antes mesmo da chegada dos resultados laboratoriais."
    },

    {
    "id": 70304,
    "station": 7,
    "species": "all",
    "audience": "veterinario",
    "difficulty": 3,
    "type": "aplicacao",
    "tags": ["sop", "protocolo_neonatal", "gestao_qualidade", "reprodutibilidade"],
    "question": "Ao elaborar um Procedimento Operacional Padrão (POP) para manejo neonatal em uma fazenda, quais componentes são essenciais para padronizar as atividades da equipe?",
    "options": [
        "Somente identificação do responsável técnico, assinaturas e lista de medicamentos autorizados.",
        "Descrição padronizada do manejo de colostragem, cuidados com o umbigo, identificação dos animais, critérios objetivos para monitoramento clínico e definição clara do fluxo de atendimento e acionamento do médico-veterinário.",
        "Apenas calendário vacinal e relação de produtos autorizados para uso na propriedade.",
        "Somente planilhas financeiras e metas econômicas do setor de cria."
    ],
    "correct": 1,
    "hint": "Um POP deve orientar de forma prática como executar as principais rotinas e quando cada colaborador deve agir.",
    "explanation": "Procedimentos Operacionais Padrão devem descrever de forma objetiva as etapas do manejo, os critérios de monitoramento e as responsabilidades de cada integrante da equipe, promovendo maior uniformidade na execução das atividades e reduzindo falhas operacionais.",
    "funFact": "Protocolos escritos e treinamentos periódicos ajudam a diminuir a variabilidade entre colaboradores e favorecem a padronização do manejo nas propriedades."}
    ];

CAMPUS_LIVES_QUIZ_DATABASE.push(...NOVAS_QUESTOES);

Object.freeze(CAMPUS_LIVES_QUIZ_DATABASE);

/* ==========================================================================
   MOTOR DE SELEÇÃO — Prioridade total ao perfil. Mistura só se ZERO questões
   existirem para o perfil naquela estação (caso extremo de banco incompleto).
   ========================================================================== */
function getQuestionsForProfile(stationId, species, audience) {
    // Pool filtrado por estação e espécie
    let pool = CAMPUS_LIVES_QUIZ_DATABASE.filter(q =>
        q.station === stationId && (q.species === 'all' || q.species === species)
    );
    if (pool.length === 0) {
        // Fallback: ignora espécie (banco incompleto)
        pool = CAMPUS_LIVES_QUIZ_DATABASE.filter(q => q.station === stationId);
    }
    if (pool.length === 0) return [];

    // Separa questões do perfil exato das demais
    let exactMatch = pool.filter(q => q.audience === audience);
    let others = pool.filter(q => q.audience !== audience);

    // Embaralha ambos
    exactMatch.sort(() => Math.random() - 0.5);
    others.sort(() => Math.random() - 0.5);

    // Seleciona 3 questões priorizando diversidade de 'type' (conceitual, aplicacao, caso_clinico…)
    function selectWithTypeDiversity(candidates, count) {
        const typesSeen = new Set();
        const diverse = [];
        const extras = [];
        candidates.forEach(q => {
            if (diverse.length < count && !typesSeen.has(q.type)) {
                typesSeen.add(q.type);
                diverse.push(q);
            } else {
                extras.push(q);
            }
        });
        const combined = [...diverse, ...extras];
        return combined.slice(0, count);
    }

    // Se há questões suficientes do perfil exato, usa somente elas (com diversidade de tipo)
    if (exactMatch.length >= 3) {
        return selectWithTypeDiversity(exactMatch, 3);
    }

    // Se há ao menos 1 questão exata, prioriza-as e preenche restante com outras
    if (exactMatch.length > 0) {
        let selection = [...exactMatch];
        for (const q of others) {
            if (selection.length >= 3) break;
            selection.push(q);
        }
        return selection;
    }

    // Último recurso: perfil totalmente ausente nesta estação — usa o que há
    return others.slice(0, 3);
}

/* ───────────────────────────────────────
   NAVEGAÇÃO E SETUP
─────────────────────────────────────── */
function switchScreen(id) {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id !== id && id !== 'screen-ranking') {
        G.prevScreen = activeScreen.id;
    } else if (activeScreen && id === 'screen-ranking') {
        G.prevScreen = activeScreen.id;
    }
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) { el.classList.add('active'); el.scrollTop = 0; }
    updateHUD();
}

function updateHUD() {
    document.getElementById('hud-farm').textContent = (G.farm || 'Fazenda');
    document.getElementById('hud-money').textContent = 'R$ ' + G.money;
    document.getElementById('hud-score').textContent = G.score + ' pts';
    document.getElementById('hud-station').textContent = (G.stationIdx + 1) + '/7';
    document.getElementById('hud-hearts').textContent = Array(5).fill('🖤').fill('❤️', 0, G.hearts).join('');
    
    const pct = Math.max(0, Math.round(G.survival));
    const fill = document.getElementById('hud-survival');
    if (fill) {
        fill.style.width = pct + '%';
        fill.style.background = pct > 60 ? 'linear-gradient(90deg,var(--green2),var(--green1))' : pct > 30 ? 'linear-gradient(90deg,var(--amber2),var(--amber))' : 'linear-gradient(90deg,#d94040,#a02020)';
    }
    document.getElementById('hud-survival-label').textContent = 'SOBREVIVÊNCIA ' + pct + '%';
}

function animateHUDElement(elementId, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.classList.remove('hud-pulse-pos', 'hud-pulse-neg');
    void el.offsetWidth;
    
    if (type === 'positive') el.classList.add('hud-pulse-pos');
    if (type === 'negative') el.classList.add('hud-pulse-neg');
}

function selectSpecies(s) {
    G.species = s;
    document.getElementById('spec-bov').classList.toggle('selected', s === 'Bovinos');
    document.getElementById('spec-ovi').classList.toggle('selected', s === 'Ovinos');
}

function goToProfileSelection() {
    const name = document.getElementById('input-farm').value.trim();
    G.farm = name || 'Fazenda Feliz';
    document.getElementById('setup-step-1').style.display = 'none';
    document.getElementById('setup-step-2').style.display = 'block';
}

function goToSpeciesSelection() {
    document.getElementById('setup-step-2').style.display = 'none';
    document.getElementById('setup-step-1').style.display = 'block';
}

function selectProfile(prof) {
    G.audience = prof;
    document.querySelectorAll('.profile-card').forEach(c => c.classList.remove('selected'));
    const targetCard = document.querySelector(`.profile-card[data-profile="${prof}"]`);
    if (targetCard) targetCard.classList.add('selected');

    // Remove botão anterior se existir
    const oldBtn = document.getElementById('btn-confirm-start');
    if (oldBtn) oldBtn.remove();

    // Insere botão de confirmação no card
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'btn-confirm-start';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.style.marginTop = '16px';

    const profileLabels = { leigo: '🌱 Produtor/Iniciante', estudante: '📚 Estudante', veterinario: '🩺 Médico Veterinário' };
    const speciesLabel = G.species === 'Bovinos' ? '🐄 Bovinos' : '🐑 Ovinos';
    confirmBtn.innerHTML = `Iniciar como ${profileLabels[prof]} · ${speciesLabel} →`;
    confirmBtn.onclick = () => startGame();

    // Insere após os cards de perfil, dentro do .card existente
    targetCard.closest('.card').appendChild(confirmBtn);
}

function startGame() {
    G.money = 100; G.score = 0; G.hearts = 5; G.survival = 100;
    G.stationIdx = 0;
    G.mgIodoDone = false; G.mgColostroDone = false; G.mgHipoDone = false; G.mgDietaDone = false;
    G.mgFeedingDone = false;
    
    G.stats.hitsByTag = {};
    G.stats.missesByTag = {};
    G.stats.hypothermiaSaved = 0;
    G.stats.colostrumFails = 0;
    
    G.globalTotalSeconds = 0;
    G.globalStartTime = Date.now();
    if(G.timerRef) clearInterval(G.timerRef);
    G.timerRef = setInterval(() => {
        const elapsed = Math.floor((Date.now() - G.globalStartTime) / 1000);
        G.globalTotalSeconds = elapsed;
        const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('hud-timer').textContent = `${m}:${s}`;
    }, 1000);

    loadStation();
}

/* ───────────────────────────────────────
   FLUXO DE ESTAÇÃO E QUIZ
─────────────────────────────────────── */
let stationQuestions = [];

function loadStation() {
    saveCheckpoint();
    if (G.stationIdx >= STATIONS.length) { showFinal(); return; }
    
    const st = STATIONS[G.stationIdx];
    G.stationHits = 0;
    G.stationTags.clear();

    let consqHTML = '';
    if (st.id === 4 && (G.stats.missesByTag['colostro'] || 0) > 0) {
        G.survival = Math.max(0, G.survival - 10);
        consqHTML = `
            <div style="background:rgba(217,64,64,0.1); border-left:3px solid var(--red); padding:10px; margin-bottom:12px; font-size:0.85rem; color:var(--text); border-radius: 4px;">
                <strong style="color:var(--red); display:block; margin-bottom:4px;">⚠️ Efeito Borboleta:</strong>
                O bezerro não recebeu colostro de qualidade ontem. A imunidade caiu a zero e uma infecção pulmonar oportunista se instalou de madrugada. <strong>(-10% Sobrevivência)</strong>
            </div>`;
        setTimeout(() => { playSound('wrong'); animateHUDElement('hud-survival', 'negative'); }, 500);
    }

    let eventHTML = '';
    if ([3, 5, 6].includes(st.id) && Math.random() < 0.3) {
        const isRain = Math.random() < 0.5; 
        if (isRain) {
            G.survival = Math.max(0, G.survival - 5);
            eventHTML = `
                <div style="background:rgba(58,127,193,0.1); border-left:3px solid var(--blue); padding:10px; margin-bottom:12px; font-size:0.85rem; color:var(--text); border-radius: 4px;">
                    <strong style="color:#7ab8e8; display:block; margin-bottom:4px;">🌧️ Evento Aleatório: Tempestade Súbita!</strong>
                    A cama da maternidade alagou. O estresse térmico reduziu a imunidade geral do rebanho. <strong>(-5% Sobrevivência)</strong>
                </div>`;
            setTimeout(() => { animateHUDElement('hud-survival', 'negative'); }, 500);
        } else {
            G.money = Math.max(0, G.money - 40);
            eventHTML = `
                <div style="background:rgba(232,160,32,0.1); border-left:3px solid var(--amber); padding:10px; margin-bottom:12px; font-size:0.85rem; color:var(--text); border-radius: 4px;">
                    <strong style="color:var(--amber); display:block; margin-bottom:4px;">☀️ Evento Aleatório: Onda de Calor!</strong>
                    As fêmeas em lactação sofreram estresse severo. Foi necessário gastar caixa com ventilação extra e soro hidratante. <strong>(- R$ 40)</strong>
                </div>`;
            setTimeout(() => { animateHUDElement('hud-money', 'negative'); }, 500);
        }
    }
    
    const badgeEl = document.getElementById('intro-badge');
    badgeEl.textContent = `Etapa ${st.id} de 7`;
    // Bug #13: highlight last station
    if (G.stationIdx === STATIONS.length - 1) {
        badgeEl.classList.add('last-station-badge');
    } else {
        badgeEl.classList.remove('last-station-badge');
    }
    document.getElementById('intro-emoji').textContent = st.emoji;
    document.getElementById('intro-title').textContent = st.title;
    
    document.getElementById('narrative-event').innerHTML = `
        <div style="font-size:0.8rem; font-weight:800; color:var(--green2); margin-bottom:8px; text-transform:uppercase;">🕒 ${st.time}</div>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; border-bottom:1px dashed var(--border); padding-bottom:12px;">
            <span style="font-size:2.2rem; background:var(--card); border-radius:50%; padding:5px; border:1px solid var(--border);">${st.character.split(' ')[0]}</span>
            <div>
                <strong style="color:var(--text); display:block; font-size:1.1rem;">${st.character.substring(st.character.indexOf(' ')+1)}</strong>
                <span style="font-size:0.8rem; color:var(--text2);">${st.role}</span>
            </div>
        </div>
        <p style="line-height:1.6; color:var(--text); font-size:0.95rem; margin-bottom: 12px;">"${st.narrative}"</p>
        ${consqHTML}
        ${eventHTML}
    `;
    
    document.getElementById('intro-text').textContent = 'O tempo está passando. O que você fará?';
    
    // Renderizar track visual de estações
    const track = document.getElementById('station-track');
    if (track) {
        track.innerHTML = '';
        STATIONS.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'sp-dot';
            if (i < G.stationIdx) dot.classList.add('done');
            else if (i === G.stationIdx) dot.classList.add('active');
            track.appendChild(dot);
        });
    }

    switchScreen('screen-station-intro');
    updateHUD(); 
}

function startQuiz() {
    const stId = STATIONS[G.stationIdx].id;
    stationQuestions = getQuestionsForProfile(stId, G.species, G.audience);
    G.questionIdx = 0;
    G.dotHistory = [];
    renderQuestion();
    switchScreen('screen-quiz');
}


function startQuestionTimer() {
    if (questionTimerRef) clearInterval(questionTimerRef);
    // Tempo adaptativo: dificuldade 1 = 30s, 2 = 38s, 3 = 50s
    const diffTime = { 1: 30, 2: 38, 3: 50 };
    let timeLeft = diffTime[G.currentQ ? G.currentQ.difficulty : 1] || 30;
    const totalTime = timeLeft;
    const bar = document.getElementById('quiz-timer');
    if (!bar) return;
    bar.style.width = '100%';
    bar.style.transition = 'none';
    bar.style.background = 'var(--green2)';

    questionTimerRef = setInterval(() => {
        if (G.answered) { clearInterval(questionTimerRef); return; }
        timeLeft--;
        const pct = (timeLeft / totalTime) * 100;
        bar.style.transition = 'width 1s linear, background 0.5s';
        bar.style.width = pct + '%';
        if (pct < 30) bar.style.background = 'var(--red)';
        else if (pct < 60) bar.style.background = 'var(--amber)';
        if (timeLeft <= 0) {
            clearInterval(questionTimerRef);
            if (!G.answered) {
                document.querySelectorAll('.opt-btn').forEach((b, i) => {
                    b.disabled = true;
                    if (i === G.currentQ.correct) b.classList.add('correct');
                });
                G.answered = true;
                G.dotHistory.push(false);
                G.streak = 0; // reset streak on timeout
                const fbBox = document.getElementById('feedback-box');
                document.getElementById('feedback-title').textContent = '⏱️ Tempo Esgotado';
                document.getElementById('feedback-title').style.color = 'var(--amber)';
                document.getElementById('feedback-desc').textContent = G.currentQ.explanation;
                document.getElementById('feedback-consequence').className = 'feedback-consequence lose';
                document.getElementById('feedback-consequence').textContent = '⏱️ Tempo esgotado! −1 coração e −4% sobrevivência. A resposta correta foi revelada.';
                document.getElementById('feedback-mentor').style.display = 'none';
                fbBox.classList.add('show');
                G.hearts = Math.max(0, G.hearts - 1);
                G.survival = Math.max(0, G.survival - 4);
                // Bug #3: register miss in stats for correct tutor analysis
                G.currentQ.tags.forEach(t => G.stats.missesByTag[t] = (G.stats.missesByTag[t] || 0) + 1);
                // Bug #4: play wrong sound on timeout
                playSound('wrong');
                updateHUD();
                animateHUDElement('hud-hearts', 'negative');
                animateHUDElement('hud-survival', 'negative');
                // Bug #2: trigger game over when hearts/survival hit zero
                if (G.hearts <= 0 || G.survival <= 0) {
                    triggerGameOver(G.currentQ.explanation);
                }
            }
        }
    }, 1000);
}

function renderQuestion() {
    if (G.questionIdx >= stationQuestions.length) { showReport(); return; }
    
    const q = stationQuestions[G.questionIdx];
    G.currentQ = q;
    G.answered = false;
    G.hintStep = 0;

    const quizScreen = document.getElementById('screen-quiz');
    if (quizScreen) quizScreen.scrollTop = 0;

    document.getElementById('quiz-counter').textContent = `${G.questionIdx + 1}/${stationQuestions.length}`;
    
    const dotsContainer = document.getElementById('progress-dots');
    dotsContainer.innerHTML = '';
    stationQuestions.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'q-dot';
        if (i === G.questionIdx) {
            dot.classList.add('active');
        } else if (i < G.questionIdx) {
            dot.classList.add(G.dotHistory[i] ? 'correct' : 'wrong');
        }
        dotsContainer.appendChild(dot);
    });
    
    const diffLabel = {1:'Fácil', 2:'Médio', 3:'Avançado'}[q.difficulty];
    document.getElementById('quiz-badge').textContent = `🎯 Nível ${diffLabel}`;
    
    const tagsContainer = document.getElementById('quiz-tags');
    tagsContainer.innerHTML = '';
    q.tags.forEach(t => {
        G.stationTags.add(t);
        const s = document.createElement('span'); s.className = 'tag-item'; s.textContent = t;
        tagsContainer.appendChild(s);
    });

    const ctxBox = document.getElementById('quiz-context-card');
    if (q.context) { ctxBox.innerHTML = `<strong>Contexto:</strong> ${q.context}`; ctxBox.style.display = 'block'; }
    else { ctxBox.style.display = 'none'; }

    document.getElementById('quiz-question-text').textContent = q.question;

    document.getElementById('hint-text').classList.remove('show');
    const hp = document.getElementById('hint-progress');
    hp.innerHTML = '';
    const hintBtn = document.getElementById('btn-hint');
    if (hintBtn) { hintBtn.disabled = false; hintBtn.textContent = `💡 Pedir Dica (R$ ${HINT_COST})`; hintBtn.style.color = ''; }
    
    const hintsArr = Array.isArray(q.hint) ? q.hint : [q.hint];
    hintsArr.forEach(() => {
        const dot = document.createElement('div'); dot.className = 'hint-dot'; hp.appendChild(dot);
    });

    const opts = document.getElementById('quiz-options');
    opts.innerHTML = '';
    q.options.forEach((o, i) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerHTML = `<span>${o}</span>`;
        btn.onclick = () => selectAnswer(i, btn);
        opts.appendChild(btn);
    });

    document.getElementById('feedback-box').classList.remove('show');
    startQuestionTimer();
}

function useHint() {
    if (G.answered) return;
    const hints = Array.isArray(G.currentQ.hint) ? G.currentQ.hint : [G.currentQ.hint];
    const hintBtn = document.getElementById('btn-hint');

    if (G.hintStep >= hints.length) {
        // Bug #10: all hints already used – button should be disabled (defensive guard)
        if (hintBtn) { hintBtn.disabled = true; hintBtn.textContent = '💡 Sem mais dicas'; }
        return;
    }

    if (G.hintStep < hints.length) {
        if (G.money >= HINT_COST) {
            G.money -= HINT_COST;
            
            let textToDisplay = hints[G.hintStep];
            const prefixos = {
                leigo: '💡 Consultoria: ',
                estudante: '🎓 Dica Técnica: ',
                veterinario: '🩺 Raciocínio Clínico: '
            };
            textToDisplay = (prefixos[G.audience] || '💡 ') + textToDisplay;

            document.getElementById('hint-text').textContent = textToDisplay;
            document.getElementById('hint-text').classList.add('show');
            
            const hintDots = document.querySelectorAll('.hint-dot');
            if(hintDots[G.hintStep]) hintDots[G.hintStep].classList.add('used');
            
            G.hintStep++;
            playSound('hint');
            // Bug #10: disable button when all hints are exhausted
            if (G.hintStep >= hints.length && hintBtn) {
                hintBtn.disabled = true;
                hintBtn.textContent = '💡 Sem mais dicas';
            }
            animateHUDElement('hud-money', 'negative');
            updateHUD();
        } else {
            if (hintBtn) {
                hintBtn.textContent = "❌ Saldo Insuficiente";
                hintBtn.style.color = "var(--red)";
                setTimeout(() => { 
                    hintBtn.textContent = `💡 Pedir Dica (R$ ${HINT_COST})`; 
                    hintBtn.style.color = "var(--amber)";
                }, 2000);
            }
        }
    }
}

function selectAnswer(idx, btn) {
    if (G.answered) return;
    G.answered = true;

    const q = G.currentQ;
    const isCorrect = (idx === q.correct);
    G.dotHistory.push(isCorrect);
    
    document.querySelectorAll('.opt-btn').forEach((b, i) => {
        b.disabled = true;
        if (i === q.correct) b.classList.add('correct');
        else if (i === idx) b.classList.add('wrong');
    });

    if (isCorrect) {
        playSound('correct');
        G.streak++;
        let bonusPts = 100 - (G.hintStep * 10);
        // Streak bonus: every 3rd consecutive correct answer
        if (G.streak > 0 && G.streak % 3 === 0) {
            bonusPts += 50;
            setTimeout(() => {
                const streakBanner = document.createElement('div');
                streakBanner.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--amber);color:var(--earth1);font-family:var(--font-title);font-size:1.8rem;padding:12px 28px;border-radius:16px;z-index:9999;animation:fadeIn .3s ease;pointer-events:none;';
                streakBanner.textContent = '🔥 Sequência ' + G.streak + '! +50 pts';
                document.body.appendChild(streakBanner);
                setTimeout(() => streakBanner.remove(), 1800);
            }, 100);
        }
        G.score += bonusPts;
        G.money += 50;
        G.stationHits++;
        G.survival = Math.min(100, G.survival + 8);
        q.tags.forEach(t => G.stats.hitsByTag[t] = (G.stats.hitsByTag[t] || 0) + 1);
        animateHUDElement('hud-survival', 'positive');
        animateHUDElement('hud-money', 'positive');
    } else {
        playSound('wrong');
        G.streak = 0;
        G.hearts = Math.max(0, G.hearts - 1);
        const survPenalty = G.audience === 'leigo' ? 6 : 8;
        G.survival = Math.max(0, G.survival - survPenalty);
        q.tags.forEach(t => G.stats.missesByTag[t] = (G.stats.missesByTag[t] || 0) + 1);

        const COLOSTRO_TAGS = ['colostro','imunidade','imunidade_passiva','ftip','ftpi','pst','brix','igg1','igg2','sonda_esofagica','qualidade_colostro','pasteurizacao','johne','plasma_oral','alternativa_colostro','protocolo_colostragem','indicadores_colostragem'];
        if (q.tags.some(t => COLOSTRO_TAGS.includes(t))) {
            G.stats.colostrumFails++;
        }

        animateHUDElement('hud-survival', 'negative');
        animateHUDElement('hud-hearts', 'negative');
    }

    if (G.hearts <= 0 || G.survival <= 0) {
        triggerGameOver(q.explanation);
        return; 
    }

    const fbBox = document.getElementById('feedback-box');
    const consq = document.getElementById('feedback-consequence');
    const title = document.getElementById('feedback-title');
    const desc = document.getElementById('feedback-desc');
    const mentor = document.getElementById('feedback-mentor');
    const mentorMsg = document.getElementById('mentor-msg');

    fbBox.classList.add('show');
    title.textContent = isCorrect ? '✓ Excelente Decisão!' : '✗ Revisão Necessária!';
    title.style.color = isCorrect ? 'var(--green2)' : 'var(--red)';
    desc.textContent = q.explanation;

    // Auto-scroll para o feedback no mobile após animação
    setTimeout(() => {
        const quizScreen = document.getElementById('screen-quiz');
        if (quizScreen && fbBox) {
            fbBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 150);
    
    const survGain = 8;
    const survLoss = G.audience === 'leigo' ? 6 : 8;
    const winText = q.consequence ? q.consequence.win : `✅ Decisão correta! Sobrevivência do rebanho aumentou (+${survGain}%).`;
    const loseText = q.consequence ? q.consequence.lose : `⚠️ Decisão equivocada. Sobrevivência do rebanho caiu (−${survLoss}%).`;

    consq.className = 'feedback-consequence ' + (isCorrect ? 'win' : 'lose');
    consq.textContent = isCorrect ? winText : loseText;

    if (q.funFact) {
        mentorMsg.textContent = q.funFact;
        mentor.style.display = 'flex';
    } else {
        mentor.style.display = 'none';
    }

    updateHUD();
    saveCheckpoint();
    
    document.getElementById('btn-next').onclick = () => {
        const stId = STATIONS[G.stationIdx].id;

        if (stId === 1 && G.questionIdx === 2 && !G.mgFeedingDone) {
            G.mgFeedingDone = true; startMinigame('feeding_choice'); return;
        }
        if (stId === 2 && G.questionIdx === 1 && !G.mgColostroDone) {
            G.mgColostroDone = true; startMinigame('colostro'); return; 
        }
        if (stId === 3 && G.questionIdx === 1 && !G.mgHipoDone) {
            G.mgHipoDone = true; startMinigame('hipotermia'); return; 
        }
        if (stId === 4 && G.questionIdx === 0 && !G.mgIodoDone) {
            G.mgIodoDone = true; startMinigame('iodo'); return; 
        }
        if (stId === 5 && G.questionIdx === 1 && !G.mgDietaDone) {
            G.mgDietaDone = true; startMinigame('dieta'); return; 
        }

        nextQuestion();
    };
}

/* ───────────────────────────────────────
   SISTEMA DE MINIJOGOS PRÁTICOS
─────────────────────────────────────── */
let mgHoldTimer = null;
let mgProgress = 0;
let mgTimerRef = null;

const MINIGAMES = {
    'feeding_choice': {
        title: "🌾 O Que Alimentar?",
        desc: "Sua vaca gestante precisa de energia! Escolha os alimentos CORRETOS para o pré-parto.",
        instruction: "Toque nos alimentos CORRETOS para o pré-parto!",
        run: buildFeedingChoiceMG
    },
    'iodo': {
        title: "Procedimento: Cura do Umbigo",
        desc: "O umbigo é a porta para o fígado do filhote. O mergulho no Iodo a 10% deve durar tempo suficiente para desidratar a estrutura.",
        instruction: "Pressione e segure o botão para manter o umbigo submerso. Não solte antes da hora!",
        run: initMinigameIodo
    },
    'colostro': {
        title: "Aquecimento do Colostro",
        desc: "O colostro congelado deve ser aquecido em banho-maria. Se passar de 42ºC, as proteínas de defesa (IgG) são destruídas.",
        instruction: "Segure para aquecer. Solte quando a temperatura estiver na ZONA VERDE (38ºC - 40ºC).",
        run: initMinigameColostro
    },
    'hipotermia': {
        title: "Glicose Intraperitoneal",
        desc: "O cordeiro está em choque hipoglicêmico. A injeção deve ser feita no flanco direito, 1.5 cm ao lado do umbigo.",
        instruction: "Toque exatamente na zona circular demarcada para aplicar a injeção com segurança.",
        run: initMinigameHipotermia
    },
    'dieta': {
        title: "Ajuste do Rúmen",
        desc: "Muito grão causa acidose ruminal. Muita fibra baixa a produção de leite. Encontre o equilíbrio.",
        instruction: "Deslize o controle para ajustar a dieta até o pH do rúmen ficar ideal (6.0 a 6.5).",
        run: initMinigameDieta
    }
};

function startMinigame(mgId) {
    const mg = MINIGAMES[mgId];
    G.activeMinigame = mgId;
    
    // Atualizar badge de modo
    const modeLabel = G.species === 'Bovinos' ? '🐄 Modo Bovino' : '🐑 Modo Ovino';
    const modeBadge = document.getElementById('mg-mode-badge');
    if (modeBadge) modeBadge.textContent = modeLabel;

    document.getElementById('mg-title').textContent = mg.title;
    document.getElementById('mg-desc').textContent = mg.desc;
    document.getElementById('mg-progress-label').textContent = mg.instruction;
    
    document.getElementById('mg-result').style.display = 'none';
    document.getElementById('mg-area').style.display = 'flex';

    // Bug #5: Start a real minigame countdown timer
    if (mgTimerRef) clearInterval(mgTimerRef);
    const totalTime = 45; // 45 seconds per minigame
    let timeLeft = totalTime;
    const bar = document.getElementById('mg-timer-bar');
    if (bar) { bar.style.width = '100%'; bar.style.background = 'var(--green2)'; bar.style.transition = 'none'; }
    mgTimerRef = setInterval(() => {
        timeLeft--;
        const pct = (timeLeft / totalTime) * 100;
        if (bar) {
            bar.style.transition = 'width 1s linear, background 0.5s';
            bar.style.width = pct + '%';
            if (pct < 30) bar.style.background = 'var(--red)';
            else if (pct < 60) bar.style.background = 'var(--amber)';
        }
        if (timeLeft <= 0) {
            clearInterval(mgTimerRef);
            // Only fail if minigame result not already shown
            const resultBox = document.getElementById('mg-result');
            if (resultBox && resultBox.style.display === 'none') {
                processMinigameResult(false, 'Tempo esgotado! O procedimento não foi concluído a tempo.', 'var(--red)', '⏱️ Tempo Esgotado');
            }
        }
    }, 1000);
    
    mg.run();
    switchScreen('screen-minigame');
    playSound('minigame_start');
}

function initMinigameIodo() {
    const area = document.getElementById('mg-area');
    mgProgress = 0;
    
    area.innerHTML = `
        <div class="mg-navel" id="mg-navel-visual">🧬</div>
        <button class="mg-cup-btn" id="mg-btn-hold">
            <div class="mg-cup-fill" id="mg-cup-fill"></div>
            <span class="mg-cup-text">👆 Segure para Mergulhar</span>
        </button>
    `;
    
    const btnHold = document.getElementById('mg-btn-hold');
    const fill = document.getElementById('mg-cup-fill');
    const navel = document.getElementById('mg-navel-visual');
    let isActivelyHolding = false; 
    
    const startHold = (e) => {
        e.preventDefault();
        if (e.type === 'mousedown' && 'ontouchstart' in window) return;
        if (isActivelyHolding) return;
        isActivelyHolding = true;
        btnHold.style.borderColor = "var(--green2)";
        
        mgHoldTimer = setInterval(() => {
            mgProgress += 2;
            fill.style.height = `${mgProgress}%`;
            
            if (mgProgress > 30) navel.textContent = '🟤';
            
            if (mgProgress >= 100) {
                clearInterval(mgHoldTimer);
                processMinigameResult(true, "O umbigo foi completamente desidratado e o canal fechado.", "var(--green2)", "Procedimento Perfeito!");
            }
        }, 50);
    };

    const stopHold = (e) => {
        e.preventDefault();
        if (!isActivelyHolding) return;
        isActivelyHolding = false;
        clearInterval(mgHoldTimer);
        
        if (mgProgress > 0 && mgProgress < 100) {
            mgProgress = 0;
            fill.style.height = '0%';
            navel.textContent = '🧬';
            btnHold.style.borderColor = "var(--red)";
            document.querySelector('.mg-cup-text').textContent = "Soltou muito cedo! Tente de novo.";
            setTimeout(() => {
                btnHold.style.borderColor = "var(--amber)";
                document.querySelector('.mg-cup-text').textContent = "👆 Segure para Mergulhar";
            }, 1500);
        }
    };

    btnHold.addEventListener('touchstart', startHold, {passive: false});
    btnHold.addEventListener('touchend', stopHold);
    btnHold.addEventListener('mousedown', startHold);
    btnHold.addEventListener('mouseup', stopHold);
    btnHold.addEventListener('mouseleave', stopHold);
}

function initMinigameColostro() {
    const area = document.getElementById('mg-area');
    mgProgress = 20;
    
    area.innerHTML = `
        <div class="mg-temp-display" id="mg-temp">20.0 ºC</div>
        <div class="mg-thermo-wrap">
            <div class="mg-thermo-danger"></div>
            <div class="mg-thermo-target"></div>
            <div class="mg-thermo-fill" id="mg-thermo-fill" style="height: 20%;"></div>
        </div>
        <button class="mg-cup-btn" id="mg-btn-heat">🔥 Segure para Aquecer</button>
    `;
    
    const btnHeat = document.getElementById('mg-btn-heat');
    const fill = document.getElementById('mg-thermo-fill');
    const tempTxt = document.getElementById('mg-temp');
    let isActivelyHolding = false;

    const heatUp = (e) => {
        e.preventDefault();
        if (e.type === 'mousedown' && 'ontouchstart' in window) return;
        if(isActivelyHolding) return;
        isActivelyHolding = true;
        btnHeat.style.borderColor = "var(--amber)";
        
        mgHoldTimer = setInterval(() => {
            mgProgress += 0.5;
            if(mgProgress > 50) mgProgress = 50;
            
            fill.style.height = `${mgProgress}%`;
            tempTxt.textContent = `${mgProgress.toFixed(1)} ºC`;
            
            if(mgProgress >= 38 && mgProgress <= 40) { fill.style.background = "var(--green2)"; tempTxt.style.color = "var(--green2)"; }
            else if (mgProgress > 40) { fill.style.background = "var(--red)"; tempTxt.style.color = "var(--red)"; }
            else { fill.style.background = "var(--blue)"; tempTxt.style.color = "var(--text)"; }
            
            if (mgProgress >= 42) {
                clearInterval(mgHoldTimer);
                processMinigameResult(false, "Você ferveu o colostro! Os anticorpos foram destruídos. O filhote ficou sem imunidade.", "var(--red)", "❌ Falhou");
            }
        }, 50);
    };

    const stopHeat = (e) => {
        e.preventDefault();
        if(!isActivelyHolding) return;
        clearInterval(mgHoldTimer);
        isActivelyHolding = false;
        btnHeat.style.borderColor = "var(--border)";
        
        if (mgProgress >= 38 && mgProgress <= 40) {
            processMinigameResult(true, "Temperatura perfeita! Os anticorpos estão intactos e prontos para absorção.", "var(--green2)", "✅ Sucesso");
        } else if (mgProgress < 38) {
            tempTxt.textContent = "Muito frio!";
            tempTxt.style.color = "var(--amber)";
            setTimeout(() => {
                mgProgress = 20;
                fill.style.height = '20%';
                fill.style.background = "var(--blue)";
                tempTxt.textContent = "20.0 ºC";
                tempTxt.style.color = "var(--text)";
            }, 1500);
        }
    };

    btnHeat.addEventListener('touchstart', heatUp, {passive: false});
    btnHeat.addEventListener('touchend', stopHeat);
    btnHeat.addEventListener('mousedown', heatUp);
    btnHeat.addEventListener('mouseup', stopHeat);
    btnHeat.addEventListener('mouseleave', stopHeat);
}

function initMinigameHipotermia() {
    const area = document.getElementById('mg-area');

    area.innerHTML = `
        <div style="text-align:center; margin-bottom: 16px;">
            <span style="font-size:0.8rem; color:var(--text2); text-transform:uppercase; letter-spacing:1px;">Flanco direito do animal</span>
        </div>
        <div class="mg-lamb-body" id="mg-lamb" style="width:240px; height:150px; position:relative; cursor:pointer;">
            <span style="font-size:3.5rem; user-select:none; pointer-events:none;">🐑</span>
            <div class="mg-target-zone" id="mg-target" style="
                position: absolute;
                right: 48px;
                bottom: 24px;
                width: 64px;
                height: 64px;
                border: 3px solid var(--amber);
                border-radius: 50%;
                background: rgba(232, 160, 32, 0.25);
                animation: pulseTarget 1.5s infinite;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.4rem;
            ">💉</div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text2); text-align: center; margin-top: 12px; padding: 0 16px; line-height: 1.5;">
            Toque exatamente na zona amarela para aplicar a injeção intraperitoneal.
        </p>
    `;

    const target = document.getElementById('mg-target');
    const lamb = document.getElementById('mg-lamb');

    target.addEventListener('click', (e) => {
        e.stopPropagation();
        target.style.background = 'rgba(94, 186, 133, 0.4)';
        target.style.borderColor = 'var(--green2)';
        target.style.animation = 'none';
        target.textContent = '✅';
        G.stats.hypothermiaSaved++;
        setTimeout(() => {
            processMinigameResult(
                true,
                'Injeção aplicada no ponto correto! A glicose foi absorvida via peritônio e o cordeiro foi retirado do choque hipoglicêmico.',
                'var(--green2)',
                '✅ Procedimento Correto'
            );
        }, 400);
    });

    target.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        target.click();
    }, { passive: false });

    lamb.addEventListener('click', (e) => {
        if (e.target === target || target.contains(e.target)) return;
        setTimeout(() => {
            processMinigameResult(
                false,
                'Você errou o ponto de injeção. A glicose não será absorvida corretamente e pode causar infecção abdominal.',
                'var(--red)',
                '❌ Erro de Procedimento'
            );
        }, 200);
    });
}

function initMinigameDieta() {
    const area = document.getElementById('mg-area');
    
    area.innerHTML = `
        <div class="mg-ph-display" id="mg-ph">pH 5.0</div>
        <div class="mg-ph-label" id="mg-ph-lbl">Muito Ácido (Risco de Acidose)</div>
        <div class="mg-slider-wrap">
            <input type="range" min="50" max="70" value="50" class="mg-range" id="mg-dieta-slider">
        </div>
        <button class="btn btn-primary" id="btn-confirm-dieta" style="width: auto; padding: 10px 20px;">Confirmar Dieta</button>
    `;
    
    const slider = document.getElementById('mg-dieta-slider');
    const phDisp = document.getElementById('mg-ph');
    const phLbl = document.getElementById('mg-ph-lbl');
    const btn = document.getElementById('btn-confirm-dieta');

    slider.addEventListener('input', (e) => {
        const val = e.target.value / 10;
        phDisp.textContent = `pH ${val.toFixed(1)}`;
        
        if(val < 5.8) { phLbl.textContent = "Muito Ácido (Excesso de Grão)"; phDisp.style.color = "var(--red)"; }
        else if (val >= 5.8 && val <= 6.5) { phLbl.textContent = "Equilíbrio Perfeito!"; phDisp.style.color = "var(--green2)"; }
        else { phLbl.textContent = "Muito Básico (Excesso de Fibra/Falta Energia)"; phDisp.style.color = "var(--amber)"; }
    });

    btn.onclick = () => {
        const val = slider.value / 10;
        if (val >= 5.8 && val <= 6.5) {
            processMinigameResult(true, "Dieta equilibrada! O rúmen está saudável e a produção de leite será máxima.", "var(--green2)", "✅ Nutrição Perfeita");
        } else {
            processMinigameResult(false, "A proporção Fibra x Grão ficou errada. Isso afetará a saúde da vaca.", "var(--red)", "❌ Erro Nutricional");
        }
    };
}

function buildFeedingChoiceMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'Toque nos alimentos CORRETOS para o pré-parto!';
    const foods = G.species === 'Bovinos' ? [
        { emoji: '🌾', label: 'Silagem de milho', correto: true },
        { emoji: '🍫', label: 'Chocolate', correto: false },
        { emoji: '🥩', label: 'Farelo de soja', correto: true },
        { emoji: '🍺', label: 'Cevada cervejeira', correto: false },
        { emoji: '🧂', label: 'Sal mineral', correto: true },
        { emoji: '🌿', label: 'Feno de qualidade', correto: true },
        { emoji: '🍬', label: 'Melaço excesso', correto: false },
        { emoji: '💧', label: 'Água limpa', correto: true },
    ] : [
        { emoji: '🌾', label: 'Feno de azevém', correto: true },
        { emoji: '🥩', label: 'Farelo de soja', correto: true },
        { emoji: '🧂', label: 'Sal mineral', correto: true },
        { emoji: '🍺', label: 'Grão úmido estragado', correto: false },
        { emoji: '🌿', label: 'Pastagem verde', correto: true },
        { emoji: '🍫', label: 'Ração de frango', correto: false },
        { emoji: '💊', label: 'Propileno glicol', correto: true },
        { emoji: '🌰', label: 'Grão de milho moído', correto: true },
    ];
    const correct = foods.filter(f => f.correto).length;
    let hits = 0;
    let errors = 0;
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'mg-score-mini';
    scoreDiv.textContent = `✅ 0/${correct} corretos selecionados`;
    area.appendChild(scoreDiv);
    const grid = document.createElement('div');
    grid.className = 'mg-alvo-grid';
    area.appendChild(grid);
    foods.forEach(item => {
        const div = document.createElement('div');
        div.className = 'mg-alvo-item';
        div.innerHTML = `${item.emoji}<span>${item.label}</span>`;
        div.addEventListener('click', () => {
            if (div.classList.contains('disabled')) return;
            div.classList.add('disabled');
            if (item.correto) {
                hits++;
                div.classList.add('hit-correct');
            } else {
                errors++;
                div.classList.add('hit-wrong');
                G.survival = Math.max(0, G.survival - 2);
                updateHUD();
            }
            scoreDiv.textContent = `✅ ${hits}/${correct} | ❌ ${errors} erro(s)`;
            if (hits === correct) {
                clearInterval(mgState.timerRef);
                setTimeout(() => showMGResult(errors === 0, errors === 0
                    ? 'Perfeito! Você sabe alimentar o rebanho no pré-parto.'
                    : `${hits} alimentos corretos, mas ${errors} escolhas erradas afetam a saúde do animal!`), 500);
            }
        });
        grid.appendChild(div);
    });
    startMGTimer(35, () => showMGResult(hits >= correct * 0.7, `Tempo! ${hits}/${correct} alimentos corretos.`));
}

// Alias helpers so buildFeedingChoiceMG can call them
function showMGResult(isWin, msg) {
    processMinigameResult(isWin, msg, isWin ? 'var(--green2)' : 'var(--red)', isWin ? '✅ Boa Escolha!' : '❌ Escolha Errada');
}
const mgState = { timerRef: null };
function startMGTimer(secs, onEnd) {
    if (mgState.timerRef) clearInterval(mgState.timerRef);
    let left = secs;
    mgState.timerRef = setInterval(() => {
        left--;
        if (left <= 0) { clearInterval(mgState.timerRef); onEnd(); }
    }, 1000);
}

function processMinigameResult(isWin, message, color, titleText) {
    if (mgTimerRef) { clearInterval(mgTimerRef); mgTimerRef = null; }
    document.getElementById('mg-area').style.display = 'none';
    const resBox = document.getElementById('mg-result');
    const title = document.getElementById('mg-result-title');
    const cons = document.getElementById('mg-consequence');
    const btnContinue = document.querySelector('#mg-result .btn-purple');
    
    title.textContent = titleText;
    title.style.color = color;
    
    if (isWin) {
        playSound('minigame_win');
        cons.innerHTML = `${message}<br><strong style="color:var(--green2); display:block; margin-top:10px;">Recompensa: +100 pts | + R$ 80</strong>`;
        G.score += 100; G.money += 80;
    } else {
        playSound('minigame_lose');
        cons.innerHTML = `${message}<br><strong style="color:var(--red); display:block; margin-top:10px;">Penalidade: -1 Coração | - R$ 50</strong>`;
        G.money = Math.max(0, G.money - 50);
        G.hearts = Math.max(0, G.hearts - 1);
        G.survival = Math.max(0, G.survival - 6);
    }
    
    updateHUD();
    resBox.style.display = 'block';

    if (G.hearts <= 0 || G.survival <= 0) {
        if (G.timerRef) clearInterval(G.timerRef);
        btnContinue.style.display = 'none';
        setTimeout(() => triggerGameOver("Falha fatal durante procedimento prático de campo."), 1500);
    } else {
        btnContinue.style.display = 'inline-block';
    }
}

function finishMinigame() {
    if (mgTimerRef) { clearInterval(mgTimerRef); mgTimerRef = null; }
    G.activeMinigame = null;
    switchScreen('screen-quiz');
    nextQuestion();
}

function nextQuestion() {
    G.questionIdx++;
    renderQuestion();
}

/* ───────────────────────────────────────
   RELATÓRIOS E GAME OVER
─────────────────────────────────────── */

function getVetTip(stationIdx, audience, hits, total) {
    const perf = hits / total;

    const tips = {
        0: {
            low:  'Atenção: O pré-parto mal gerenciado é a raiz de 60% das perdas neonatais. Revise o Escore de Condição Corporal das matrizes.',
            mid:  'Bom começo! Lembre-se de que o manejo no terço final da gestação define a qualidade do colostro e a força do filhote ao nascer.',
            high: 'Excelente! Você sabe que preparar a mãe é preparar o filhote. A fazenda já começa com vantagem.'
        },
        1: {
            low:  'Alerta crítico: Falhas no colostro são irreversíveis. O intestino fecha em 24h. Sem IgG no sangue, o filhote está indefeso.',
            mid:  'Progrida! A "Regra dos 4 Litros nas 4 Primeiras Horas" salva vidas. O refratômetro de Brix deve ser ferramenta padrão da fazenda.',
            high: 'Domínio completo do colostro! Você protegeu a imunidade passiva do rebanho com precisão.'
        },
        2: {
            low:  'Revise urgente: Hipotermia severa + hipoglicemia = morte em horas. Glicose intraperitoneal antes de aquecer o animal é protocolo obrigatório.',
            mid:  'Fique atento: O aquecimento externo sem corrigir a glicemia pode matar o animal por redistribuição circulatória. Ordem: glicose → calor.',
            high: 'Protocolo perfeito! Você entende que a sequência importa tanto quanto a intervenção.'
        },
        3: {
            low:  'Umbigo não tratado = porta aberta para septicemia. O iodo a 10% por imersão (não apenas spray) é inegociável nas primeiras horas de vida.',
            mid:  'Continue evoluindo! Onfaloflebite, onfaloarterite e úraco persistente são complicações sérias de um protocolo simples ignorado.',
            high: 'Excelente controle infeccioso! A curva de mortalidade neonatal da sua fazenda refletirá isso.'
        },
        4: {
            low:  'Atenção: Vacas em Balanço Energético Negativo produzem menos leite e têm mais problemas reprodutivos. Água e fibra são a base de tudo.',
            mid:  'Bom! A SARA (Acidose Ruminal Subaguda) é silenciosa. O único sinal muitas vezes é a oscilação da gordura no leite.',
            high: 'Nutrição de precisão aplicada! A curva de lactação da sua fazenda está otimizada.'
        },
        5: {
            low:  'Revise os protocolos vacinais! Vacinação materna pré-parto é o método mais barato de proteger neonatos. Sem custo por animal nascido.',
            mid:  'Avance! A "Janela de Vulnerabilidade Imunológica" é o período mais crítico — anticorpos maternos caindo, vacina ainda não funcionando.',
            high: 'Protocolo imunológico impecável! Você fecha as janelas de vulnerabilidade no momento certo.'
        },
        6: {
            low:  'Dados sem análise não são gestão. Uma TMN de 15% significa perder R$ 4.500 por cada 100 nascimentos em cordeiros de R$ 300,00.',
            mid:  'Bom raciocínio econômico! Mostrar ROI de intervenções veterinárias é a ferramenta mais poderosa junto ao produtor.',
            high: 'Decisões baseadas em dados: o diferencial do veterinário moderno. Você transformou epidemiologia em argumento financeiro.'
        }
    };

    const set = tips[stationIdx] || tips[0];
    if (perf >= 0.9) return set.high;
    if (perf >= 0.5) return set.mid;
    return set.low;
}

function showReport() {
    document.getElementById('rep-hits').textContent = `${G.stationHits}/${stationQuestions.length}`;
    document.getElementById('rep-survival').textContent = `${Math.round(G.survival)}%`;
    
    // Mapa de tags internas para rótulos legíveis em português
    const TAG_LABELS = {
        // Estação 1
        gestacao:'Gestação e Reprodução', tempo:'Período Gestacional', biologia:'Biologia Animal',
        alimentacao:'Alimentação e Nutrição', gordura:'Condição Corporal (ECC)', manejo:'Manejo da Propriedade',
        ovelha:'Manejo de Ovinos', gemeos:'Gestação Gemelar', energia:'Balanço Energético',
        maternidade:'Área de Maternidade', limpeza:'Higiene da Maternidade', parto:'Manejo do Parto',
        ecc:'Escore de Condição Corporal', nutricao:'Nutrição Animal', peripartal:'Período Periparto',
        fisiologia:'Fisiologia Veterinária', metabolismo:'Metabolismo Animal',
        anestro:'Anestro e Reprodução', dietas_anionicas:'Dietas Aniônicas (DCAD)', minerais:'Suplementação Mineral',
        periodo_transicao:'Período de Transição', far_off:'Fase Far-Off', close_up:'Fase Close-Up',
        cetose:'Cetose Neonatal/Puerperal', bhb:'Beta-Hidroxibutirato (BHB)', monitoramento:'Monitoramento Clínico',
        pre_parto:'Manejo Pré-Parto', dcad:'DCAD e Sais Aniônicos', sais_anionicos:'Sais Aniônicos',
        pH_urinario:'pH Urinário', hipocalcemia:'Hipocalcemia', distócia:'Distócia e Obstetrícia',
        obstetrica:'Manobras Obstétricas', manobra:'Obstetrícia a Campo', cesarea:'Cesariana Bovina',
        emergencia:'Emergências a Campo', sinais:'Sinais Clínicos',
        // Estação 2
        colostro:'Protocolo de Colostro', ftip:'FTIP — Falha de Imunidade Passiva',
        ftpi:'FTIP — Falha de Imunidade Passiva', imunidade:'Imunidade Neonatal',
        imunidade_passiva:'Transferência de Imunidade Passiva', pst:'PST — Proteína Sérica Total',
        brix:'Refratometria de Brix', igg1:'IgG1 — Imunoglobulina Bovina', igg2:'IgG2 — Imunoglobulina Bovina',
        sonda_esofagica:'Sonda Esofágica (Bezerro Fraco)', mamadeira:'Alimentação com Mamadeira',
        bezerro_fraco:'Manejo do Bezerro Fraco', qualidade_colostro:'Qualidade do Colostro',
        mae:'Manejo da Matriz', pasteurizacao:'Pasteurização de Colostro (LTLT)',
        johne:'Doença de Johne / Paratuberculose', mycobacterium:'Mycobacterium paratuberculosis',
        biosseguridade:'Biosseguridade do Bezerreiro', plasma_oral:'Plasma Oral como Alternativa',
        alternativa_colostro:'Alternativas ao Colostro', auditoria:'Auditoria de Bezerreiro',
        protocolo_colostragem:'Protocolo de Colostragem (5 Pilares)', indicadores_colostragem:'Indicadores de Colostragem',
        // Estação 3
        hipotermia:'Hipotermia Neonatal', frio:'Prevenção do Frio', termogenese:'Termogênese Neonatal',
        gordura_marrom:'Tecido Adiposo Marrom (TAM)', glicose:'Glicose Intraperitoneal',
        intraperitoneal:'Via Intraperitoneal', afterdrop:'Fenômeno de Afterdrop',
        reaquecimento_gradual:'Reaquecimento Gradual', fluidoterapia:'Fluidoterapia Neonatal',
        lampada_infravermelha:'Lâmpada Infravermelha (Abrigo)', abrigo:'Abrigo para Neonatos',
        prevencao_frio:'Prevenção de Hipotermia', temperatura_normal:'Temperatura Retal Normal',
        termometro:'Uso de Termômetro a Campo', classificacao_hipotermia:'Classificação Clínica da Hipotermia',
        protocolo_clinico:'Protocolo Clínico de Campo', hipoglicemia:'Hipoglicemia Neonatal',
        // Estação 4
        umbigo:'Cura e Higiene do Umbigo', onfalite:'Onfalite e Complicações',
        artrite_septica:'Artrite Séptica Neonatal', junta_boba:'Artrite Séptica (Junta Boba)',
        iodo:'Solução de Iodo a 10%', higiene_baia:'Higiene da Baia de Parto',
        pressao_infecciosa:'Pressão de Infecção Ambiental', diarreia:'Diarreia Neonatal',
        etiologia:'Diagnóstico Etiológico', ecoli:'E. coli Enterotoxigênica (ETEC K99)',
        faixa_etaria:'Diagnóstico por Faixa Etária', clostridiose:'Clostridiose Neonatal',
        clostridium_perfringens:'C. perfringens Tipo C', enterite_hemorragica:'Enterite Hemorrágica',
        contaminacao_colostro:'Contaminação Bacteriana do Colostro', bacterias:'Carga Bacteriana',
        lavagem_articular:'Lavagem Articular Séptica', antibioticoterapia:'Antibioticoterapia Neonatal',
        prognostico:'Prognóstico Clínico', septicemia:'Septicemia Neonatal',
        // Estação 5
        ben:'Balanço Energético Negativo (BEN)', febre_leite:'Febre do Leite (Hipocalcemia)',
        calcio:'Cálcio e Metabolismo Mineral', lactacao:'Nutrição na Lactação',
        cetose_tipo1:'Cetose Tipo I (Subnutrição)', cetose_tipo2:'Cetose Tipo II (Vaca Gorda)',
        lipidose_hepatica:'Lipidose Hepática', cetose_subclinica:'Cetose Subclínica',
        rebanho:'Monitoramento de Rebanho', dae:'Deslocamento de Abomaso à Esquerda',
        atonia:'Atonia do Abomaso', propilenoglicol:'Propileno Glicol (Precursor Glicogênico)',
        gliconeogenese:'Gliconeogênese Hepática', toxicidade:'Toxicidade por Superdosagem',
        reconhecimento:'Reconhecimento de Doenças Metabólicas', alimentacao_vaca:'Alimentação da Vaca em Lactação',
        // Estação 6
        vacina:'Vacinação e Imunoprofilaxia', cadeia_frio:'Cadeia de Frio Vacinal',
        armazenamento:'Armazenamento de Vacinas', tetano:'Tétano Neonatal (Mal do Sete)',
        vacina_viva:'Vacinas Vivas Modificadas (VVM)', gestacao:'Vacinação em Gestantes',
        bvdv:'BVDV e Animais Persistentemente Infectados', animal_pi:'Animal PI (BVDV)',
        anticorpos_maternos:'Anticorpos Colostrais Maternos', janela_imunologica:'Janela de Vulnerabilidade Imunológica',
        timing_vacinal:'Timing do Calendário Vacinal', mannheimia:'Mannheimia haemolytica (CRB)',
        complexo_respiratorio:'Complexo Respiratório Bovino (CRB)', pneumonia_enzootica:'Pneumonia Enzoótica',
        clostridioses:'Clostridioses em Ovinos', bacterina_toxoide:'Bacterina-Toxoide Polivalente',
        primovacinacao:'Primovacinação em Virgens',
        // Estação 7
        registros:'Registros e Fichas da Fazenda', gestao:'Gestão da Propriedade Rural',
        dados:'Tomada de Decisão Baseada em Dados', periodo_servico:'Período de Serviço e Fertilidade',
        reproducao:'Eficiência Reprodutiva do Rebanho', eficiencia:'Eficiência Produtiva',
        indicador:'Indicadores Zootécnicos', roi:'ROI de Intervenções Veterinárias',
        custo_beneficio:'Análise de Custo-Benefício', colostragem:'Protocolo de Colostragem',
        sop:'POP/SOP de Manejo Neonatal', protocolo_neonatal:'Protocolo Neonatal Padronizado',
        gestao_qualidade:'Gestão da Qualidade do Bezerreiro', reproducibilidade:'Reprodutibilidade de Protocolos',
        epidemiologia:'Investigação Epidemiológica', surto_diarreia:'Surto de Diarreia Neonatal',
        causa_raiz:'Análise de Causa-Raiz', tmn:'Taxa de Mortalidade Neonatal (TMN)',
        curva_de_mortalidade:'Curva de Mortalidade Neonatal'
    };

    const learnings = document.getElementById('rep-learnings');
    learnings.innerHTML = '';

    const mastered = [];
    const toReview = [];

    G.stationTags.forEach(t => {
        const hits   = G.stats.hitsByTag[t] || 0;
        const misses = G.stats.missesByTag[t] || 0;
        const label  = TAG_LABELS[t] || t.replace(/_/g, ' ');
        if (misses > 0) toReview.push(label);
        else if (hits > 0) mastered.push(label);
        else toReview.push(label); // tag visto, mas não respondido (context only)
    });

    if (mastered.length > 0) {
        const header = document.createElement('li');
        header.style.cssText = 'list-style:none; font-weight:800; color:var(--green2); font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; margin-top:4px;';
        header.textContent = '✅ Dominado';
        learnings.appendChild(header);
        mastered.forEach(label => {
            const li = document.createElement('li');
            li.textContent = label;
            li.style.cssText = 'color:var(--green2);';
            learnings.appendChild(li);
        });
    }

    if (toReview.length > 0) {
        const header = document.createElement('li');
        header.style.cssText = 'list-style:none; font-weight:800; color:var(--amber); font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; margin-top:8px;';
        header.textContent = '📖 Revisar';
        learnings.appendChild(header);
        toReview.forEach(label => {
            const li = document.createElement('li');
            li.textContent = label;
            li.style.cssText = 'color:var(--amber);';
            learnings.appendChild(li);
        });
    }

    if (mastered.length === 0 && toReview.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhum dado de aprendizado coletado nesta etapa.';
        li.style.color = 'var(--text2)';
        learnings.appendChild(li);
    }

    document.getElementById('rep-vet').textContent =
        getVetTip(G.stationIdx, G.audience, G.stationHits, stationQuestions.length);

    // Clean up any previously appended warning/butterfly divs before potentially adding a new one
    const reportCard = document.querySelector('#screen-report .card');
    if (reportCard) {
        reportCard.querySelectorAll('.butterfly-warning').forEach(el => el.remove());
    }

    // Aviso de borboleta se houver falhas em colostro
    const colostrumMisses = G.stats.missesByTag['colostro'] || 0;
    if (G.stationIdx === 1 && colostrumMisses > 0) {
        const warning = document.createElement('div');
        warning.className = 'butterfly-warning';
        warning.style.cssText = 'margin-top:16px; background:rgba(217,64,64,0.08); border-left:3px solid var(--red); padding:10px 12px; border-radius:8px; font-size:0.82rem; color:var(--text2);';
        warning.innerHTML = '<strong style="color:var(--red); display:block; margin-bottom:4px;">⚠️ Alerta Futuro — Efeito Borboleta</strong>Falhas no protocolo de colostro podem gerar consequências nas próximas etapas. Fique atento ao estado imunológico do rebanho na Etapa 4.';
        if (reportCard) reportCard.appendChild(warning);
    }

    switchScreen('screen-report');
    // Bug #8: update button text on last station
    const nextBtn = document.querySelector('#screen-report .btn-primary');
    if (nextBtn) {
        nextBtn.textContent = G.stationIdx === STATIONS.length - 1
            ? 'Ver Resultado Final 🏆'
            : 'Próxima Etapa →';
    }
}

function nextStation() {
    G.stationIdx++;
    loadStation();
}

function triggerGameOver(lastExplanation) {
    clearCheckpoint();
    clearInterval(G.timerRef);
    
    const visualEl = document.getElementById('final-farm-visual');
    if (visualEl) {
        visualEl.textContent = '🪦📉';
        visualEl.classList.add('no-bounce');
    }
    
    document.getElementById('final-title').textContent = 'O Rebanho Colapsou';
    document.getElementById('final-title').style.color = 'var(--red)';
    document.getElementById('final-mode-label').textContent = 'A falta de intervenção técnica resultou em perdas irreversíveis.';
    
    document.getElementById('final-score').textContent = `Falência (R$ ${G.money})`;
    document.getElementById('final-survival').textContent = '0% - Intervenção Necessária';
    
    // Bug #12: show accumulated stats on game over
    const strDiv = document.getElementById('final-strengths');
    if (strDiv) {
        const stationsReached = G.stationIdx + 1;
        const totalHits = Object.values(G.stats.hitsByTag).reduce((a, b) => a + b, 0);
        const totalMisses = Object.values(G.stats.missesByTag).reduce((a, b) => a + b, 0);
        strDiv.innerHTML = `
            <strong style="color:var(--red); display:block; margin-bottom:10px;">Causa Mortis Principal:</strong>
            <p style="font-size:0.85rem; color:var(--text2); margin-bottom:14px; line-height:1.5;">${lastExplanation}</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:1.4rem; font-weight:800; color:var(--amber);">${stationsReached}/7</div>
                    <div style="font-size:0.72rem; color:var(--text2); margin-top:2px;">Etapas Concluídas</div>
                </div>
                <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:1.4rem; font-weight:800; color:var(--red);">${G.hearts}</div>
                    <div style="font-size:0.72rem; color:var(--text2); margin-top:2px;">Corações Restantes</div>
                </div>
                <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:1.4rem; font-weight:800; color:var(--green2);">${totalHits}</div>
                    <div style="font-size:0.72rem; color:var(--text2); margin-top:2px;">Acertos</div>
                </div>
                <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:1.4rem; font-weight:800; color:var(--red);">${G.score}</div>
                    <div style="font-size:0.72rem; color:var(--text2); margin-top:2px;">Pontos</div>
                </div>
            </div>`;
    }
    
    const weakDiv = document.getElementById('final-weaknesses');
    if (weakDiv) weakDiv.innerHTML = '<small>Revise os protocolos de manejo e tente novamente.</small>';
    
    // Hide medals and history sections that aren't relevant on game over
    const medalsDiv = document.getElementById('final-medals');
    if (medalsDiv) medalsDiv.innerHTML = '<small style="color:var(--text2); font-style:italic;">Partida encerrada antes da conclusão.</small>';
    const histUl = document.getElementById('final-history');
    if (histUl) histUl.innerHTML = `<li style="color:var(--red);">⚠️ O rebanho colapsou na Etapa ${G.stationIdx + 1} de 7.</li>`;
    
    // Tutor analysis for game over
    const msgEl = document.getElementById('tutor-message');
    if (msgEl) msgEl.textContent = '"A temporada foi encerrada prematuramente. O sistema de sobrevivência atingiu zero, indicando falhas críticas no protocolo de manejo. Revise os conceitos desta etapa antes de tentar novamente."';
    const recEl = document.getElementById('tutor-recommendations');
    if (recEl) {
        const st = STATIONS[G.stationIdx];
        recEl.innerHTML = `<li>Foque nos conceitos da <strong>Etapa ${st.id}: ${st.title}</strong>.</li>
                           <li>Responda com cuidado — cada erro reduz a sobrevivência do rebanho.</li>
                           <li>Use as dicas (R$ ${HINT_COST}) quando incerto, mas preserve o saldo.</li>`;
    }
    
    switchScreen('screen-final');
}

function showFinal() {
    clearCheckpoint();
    clearInterval(G.timerRef);
    const surv = Math.round(G.survival);
    saveToRanking(G.score, surv);
    
    const visualEl = document.getElementById('final-farm-visual');
    if (visualEl) {
        visualEl.classList.remove('no-bounce');
        if (surv >= 90) visualEl.textContent = '🐄🚜🏡🌾';
        else if (surv >= 70) visualEl.textContent = '🏠🚜🐄';
        else if (surv >= 50) visualEl.textContent = '🏠🌾';
        else visualEl.textContent = '🏚️📉';
    }

    document.getElementById('final-title').textContent = surv >= 80 ? '🏆 Safra Concluída!' : '📚 Temporada Finalizada';
    const perfis = {leigo: 'Produtor/Iniciante', estudante: 'Estudante (Técnico)', veterinario: 'Médico Veterinário'};
    document.getElementById('final-profile').textContent = perfis[G.audience];

    // Calcular tempo total formatado
    const totalSecs = G.globalTotalSeconds;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const tempoFormatado = `${mins}m ${secs.toString().padStart(2,'0')}s`;

    const speciesLabel = G.species === 'Bovinos' ? '🐄 Bovinos' : '🐑 Ovinos';
    document.getElementById('final-mode-label').textContent =
        `${speciesLabel} · ${perfis[G.audience]} · Duração: ${tempoFormatado}`;
    document.getElementById('final-score').textContent = `R$ ${G.money} (${G.score} pts)`;
    
    const survColor = surv >= 70 ? 'var(--green2)' : (surv >= 40 ? 'var(--amber)' : 'var(--red)');
    const survEl = document.getElementById('final-survival');
    if (survEl) {
        survEl.textContent = `${surv}%`;
        survEl.style.color = survColor;
    }

    const compDiv = document.getElementById('final-strengths');
    compDiv.innerHTML = '';
    let weakTags = [];
    
    const allTags = new Set([...Object.keys(G.stats.hitsByTag), ...Object.keys(G.stats.missesByTag)]);
    
    if (allTags.size === 0) {
        compDiv.innerHTML = '<small style="color:var(--text2)">Nenhum dado clínico coletado.</small>';
    } else {
        allTags.forEach(tag => {
            const hits = G.stats.hitsByTag[tag] || 0;
            const misses = G.stats.missesByTag[tag] || 0;
            const total = hits + misses;
            
            if(total > 0) {
                const pct = Math.round((hits / total) * 100);
                const color = pct >= 70 ? 'var(--green2)' : (pct >= 40 ? 'var(--amber)' : 'var(--red)');
                
                const filledBlocks = Math.round(pct / 10);
                const visualBar = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);
                
                if(pct < 60) weakTags.push(tag);
                
                compDiv.innerHTML += `
                <div style="margin-bottom:10px; font-family:monospace; font-size:0.9rem; background:rgba(0,0,0,0.2); padding:8px; border-radius:6px; border-left: 3px solid ${color};">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span style="font-family:var(--font); font-weight:700; color:var(--text); text-transform:capitalize;">${tag}</span> 
                        <span style="color:${color}; font-weight:bold;">${pct}%</span>
                    </div>
                    <div style="color:${color}; letter-spacing:1px; font-size:0.8rem;">${visualBar}</div>
                </div>`;
            }
        });
    }
    
    const weakDiv = document.getElementById('final-weaknesses');
    if (weakTags.length > 0) {
        weakDiv.style.display = 'flex';
        weakDiv.innerHTML = '';

        const label = document.createElement('strong');
        label.style.cssText = 'display:block; width:100%; color:var(--red); font-size:0.85rem; margin-bottom:6px;';
        label.textContent = '⚠️ Temas para Revisão:';
        weakDiv.appendChild(label);

        weakTags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-item';
            span.textContent = tag;
            weakDiv.appendChild(span);
        });
    } else {
        weakDiv.style.display = 'none';
    }

    const medalsDiv = document.getElementById('final-medals');
    let medalsHTML = '';
    
    if (surv >= 90) {
        medalsHTML += `<span style="background: rgba(94,186,133,0.15); border: 1px solid var(--green2); color: var(--green2); padding: 6px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 4px;">🥇 Guardião Neonatal</span>`;
    }
    if (G.money >= 250) {
        medalsHTML += `<span style="background: rgba(232,160,32,0.15); border: 1px solid var(--amber); color: var(--amber); padding: 6px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 4px;">💰 Gestor Ouro</span>`;
    }
    if ((G.stats.hitsByTag['colostro'] || 0) >= 1 && (G.stats.missesByTag['colostro'] || 0) === 0) {
        medalsHTML += `<span style="background: rgba(58,127,193,0.15); border: 1px solid var(--blue); color: #7ab8e8; padding: 6px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 4px;">🍼 Mestre do Colostro</span>`;
    }
    if (G.hearts === 5) {
        medalsHTML += `<span style="background: rgba(217,64,64,0.15); border: 1px solid var(--red); color: #ff8a8a; padding: 6px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 4px;">❤️ Intocável</span>`;
    }
    if (medalsHTML === '') {
        medalsHTML = '<small style="color:var(--text2); font-style: italic;">Nenhuma conquista especial desbloqueada nesta safra.</small>';
    }
    if(medalsDiv) medalsDiv.innerHTML = medalsHTML;

    const histUl = document.getElementById('final-history');
    let histHTML = '';
    
    const totalAnimals = 50;
    const saved = Math.round((surv / 100) * totalAnimals);
    const lost = totalAnimals - saved;
    
    histHTML += `<li style="margin-bottom:4px;">✔️ Garantiu a sobrevivência de <strong>${saved} animais</strong> no lote.</li>`;
    if (lost > 0) {
        histHTML += `<li style="margin-bottom:4px; color:var(--red);">⚠️ Perdeu <strong>${lost} animais</strong> devido a falhas de protocolo.</li>`;
    }
    
    const COLOSTRO_HITS_TAGS = ['colostro','imunidade_passiva','ftip','pst','brix','igg1','igg2','sonda_esofagica','qualidade_colostro','pasteurizacao','plasma_oral','protocolo_colostragem','indicadores_colostragem'];
    const COLOSTRO_MISS_TAGS  = [...COLOSTRO_HITS_TAGS, 'ftpi'];
    const HIPOTERMIA_TAGS     = ['hipotermia','frio','termogenese','gordura_marrom','glicose','intraperitoneal','afterdrop','reaquecimento_gradual','fluidoterapia','lampada_infravermelha','abrigo','prevencao_frio','temperatura_normal'];
    const VACINA_TAGS         = ['vacina','vacina_viva','imunologia','anticorpos_maternos','janela_imunologica','timing_vacinal','cadeia_frio','tetano','bvdv','animal_pi','mannheimia','complexo_respiratorio','clostridioses','bacterina_toxoide','primovacinacao'];

    if (HIPOTERMIA_TAGS.some(t => (G.stats.hitsByTag[t] || 0) > 0) || G.stats.hypothermiaSaved > 0) {
        const savedCount = G.stats.hypothermiaSaved > 0 ? ` (${G.stats.hypothermiaSaved} cordeiro${G.stats.hypothermiaSaved > 1 ? 's' : ''} salvo${G.stats.hypothermiaSaved > 1 ? 's' : ''} com glicose IP)` : '';
        histHTML += `<li style="margin-bottom:4px;">✔️ Agiu rápido e reverteu quadros de choque térmico${savedCount}.</li>`;
    }
    if (COLOSTRO_MISS_TAGS.some(t => (G.stats.missesByTag[t] || 0) > 0) || G.stats.colostrumFails > 0) {
        histHTML += `<li style="margin-bottom:4px; color:var(--amber);">⚠️ Falhou na janela de ouro do colostro, gerando risco de FTIP.</li>`;
    } else if (COLOSTRO_HITS_TAGS.some(t => (G.stats.hitsByTag[t] || 0) > 0)) {
        histHTML += `<li style="margin-bottom:4px;">✔️ Fez excelente gestão do banco de colostro e imunidade passiva.</li>`;
    }
    if (VACINA_TAGS.some(t => (G.stats.missesByTag[t] || 0) > 0)) {
        histHTML += `<li style="margin-bottom:4px; color:var(--amber);">⚠️ Cometeu erros graves no protocolo de imunização.</li>`;
    }
    
    if(histUl) histUl.innerHTML = histHTML;

    generateTutorAnalysis(surv, weakTags);
    switchScreen('screen-final');
}

function generateTutorAnalysis(survival, weakTags) {
    const msgEl = document.getElementById('tutor-message');
    const recEl = document.getElementById('tutor-recommendations');
    if(!msgEl || !recEl) return;
    
    recEl.innerHTML = '';

    if (survival >= 90) {
        msgEl.textContent = `"Excelente trabalho! Você demonstrou uma tomada de decisão clínica precisa e ágil. A fazenda teve perdas mínimas, o que garantiu um alto retorno financeiro e bem-estar animal."`;
    } else if (survival >= 60) {
        msgEl.textContent = `"Uma temporada mediana. Você salvou a maioria do rebanho, mas algumas decisões hesitantes causaram perdas financeiras e de vidas que poderiam ser evitadas com protocolos mais rígidos."`;
    } else {
        msgEl.textContent = `"Tivemos uma temporada crítica. A alta taxa de mortalidade indica que precisamos revisar conceitos urgentes de manejo e fisiologia antes da próxima parição."`;
    }

    if (weakTags.length === 0) {
        recEl.innerHTML = `<li><strong>Parabéns!</strong> Você não apresentou falhas conceituais nesta rodada.</li>
                           <li><strong>Próximo Passo:</strong> Tente jogar escolhendo o nível "Médico Veterinário" para testar conhecimentos avançados e casos clínicos complexos.</li>`;
    } else {
        const topWeaknesses = weakTags.slice(0, 3);
        
        topWeaknesses.forEach(tag => {
            let recommendation = "";
            if (tag.includes('colostro') || tag.includes('ftip') || tag.includes('ftpi') || tag.includes('imunidade_passiva')) {
                recommendation = "Revisar a fisiologia da absorção de imunoglobulinas (IgG), o tempo de fechamento intestinal neonatal (janela de 24h) e os critérios de PST por refratometria (meta ≥ 5,5 g/dL).";
            } else if (tag.includes('umbigo') || tag.includes('onfalite') || tag.includes('artrite_septica') || tag.includes('iodo')) {
                recommendation = "Estudar a anatomia das estruturas umbilicais (veia, artérias, úraco) e a técnica correta de imersão em iodo 10%, incluindo frequência e consequências da onfaloflebite.";
            } else if (tag.includes('frio') || tag.includes('hipotermia') || tag.includes('gordura_marrom') || tag.includes('termogenese')) {
                recommendation = "Revisar o catabolismo do Tecido Adiposo Marrom (TAM) em neonatos, a classificação clínica da hipotermia por grau de severidade e o protocolo de glicose intraperitoneal em hipotermia severa.";
            } else if (tag.includes('glicose') || tag.includes('hipoglicemia') || tag.includes('intraperitoneal')) {
                recommendation = "Aprofundar o protocolo de glicose IP em cordeiros: ponto anatômico de aplicação, dose (10 mL/kg de glicose 20% morna a 38-39°C) e sequência obrigatória antes do reaquecimento externo.";
            } else if (tag.includes('vacina') || tag.includes('imunologia') || tag.includes('anticorpos_maternos') || tag.includes('janela_imunologica')) {
                recommendation = "Revisar os conceitos de imunidade passiva vs. ativa, a 'Janela de Vulnerabilidade Imunológica' (2-4 meses) e as contraindicações de VVMs em fêmeas gestantes (risco de animais PI por BVDV).";
            } else if (tag.includes('diarreia') || tag.includes('etiologia') || tag.includes('reidratacao') || tag.includes('acidose')) {
                recommendation = "Estudar o diagnóstico diferencial das diarreias neonatais por faixa etária (ETEC K99 < 5 dias, Crypto/Rota 5-15 dias, Eimeria > 3 sem.) e os critérios de fluidoterapia IV em acidose metabólica severa.";
            } else if (tag.includes('septicemia') || tag.includes('meningite') || tag.includes('clostridiose') || tag.includes('artrite')) {
                recommendation = "Aprofundar o diagnóstico e tratamento de septicemia neonatal com envolvimento articular e do SNC, e o protocolo de bacterinas polivalentes de clostrídios no pré-parto materno.";
            } else if (tag.includes('ben') || tag.includes('cetose') || tag.includes('bhb') || tag.includes('propilenoglicol')) {
                recommendation = "Revisar a fisiopatologia do BEN no pós-parto, as diferenças entre cetose tipo I e II, o monitoramento de BHB a campo (meta < 1,2 mmol/L) e o mecanismo gliconeogênico do propilenoglicol.";
            } else if (tag.includes('calcio') || tag.includes('hipocalcemia') || tag.includes('dcad') || tag.includes('pH_urinario')) {
                recommendation = "Estudar o protocolo de dietas aniônicas (DCAD negativo), monitoramento por pH urinário (meta 6,0-6,8 em raças europeias) e o protocolo de gluconato de cálcio IV em hipocalcemia clínica.";
            } else if (tag.includes('rumen') || tag.includes('sara') || tag.includes('lactacao') || tag.includes('fibra')) {
                recommendation = "Revisar a fisiologia da fermentação ruminal, os riscos da SARA por excesso de concentrado no pós-parto imediato e a importância da FDN efetivo para a saúde do rúmen e gordura do leite.";
            } else if (tag.includes('tmn') || tag.includes('roi') || tag.includes('indicador') || tag.includes('epidemiologia')) {
                recommendation = "Praticar o cálculo de Taxa de Mortalidade Neonatal (TMN), análise de custo-benefício de intervenções veterinárias (ROI) e a metodologia de investigação epidemiológica de surtos neonatais.";
            } else if (tag.includes('periodo_transicao') || tag.includes('far_off') || tag.includes('close_up')) {
                recommendation = "Aprofundar as estratégias nutricionais das fases far-off e close-up do período de transição de bovinos leiteiros e sua relação com o BEN pós-parto.";
            } else if (tag.includes('colostro') || tag.includes('pst') || tag.includes('brix')) {
                recommendation = "Revisar os critérios de qualidade de colostro por refratometria de Brix (meta ≥ 22%), a mensuração de PST em bezerros de 2-7 dias (meta ≥ 5,5 g/dL) e os 5 pilares do protocolo de colostragem.";
            } else {
                recommendation = `Pesquisar protocolos e manejo relacionados ao tema: <strong>${tag}</strong>.`;
            }
            recEl.innerHTML += `<li>${recommendation}</li>`;
        });
    }
}

/* ───────────────────────────────────────
   INIT
─────────────────────────────────────── */
function toggleMute() {
    G.muted = !G.muted;
    document.getElementById('btn-mute').textContent = G.muted ? '🔇' : '🔊';
}

/* ───────────────────────────────────────
   RANKING LOCAL (LocalStorage)
─────────────────────────────────────── */

function saveCheckpoint() {
    const checkpoint = {
        farm: G.farm,
        species: G.species,
        audience: G.audience,
        money: G.money,
        score: G.score,
        hearts: G.hearts,
        survival: G.survival,
        stationIdx: G.stationIdx,
        questionIdx: G.questionIdx,
        streak: G.streak,
        stats: G.stats,
        dotHistory: G.dotHistory || [],
        mgIodoDone: G.mgIodoDone,
        mgColostroDone: G.mgColostroDone,
        mgHipoDone: G.mgHipoDone,
        mgDietaDone: G.mgDietaDone,
        mgFeedingDone: G.mgFeedingDone,
        savedAt: Date.now()
    };
    localStorage.setItem('vidasDoCampoCheckpoint', JSON.stringify(checkpoint));
}

function loadCheckpoint() {
    const raw = localStorage.getItem('vidasDoCampoCheckpoint');
    if (!raw) return null;
    const cp = JSON.parse(raw);
    if (Date.now() - cp.savedAt > 86400000) {
        localStorage.removeItem('vidasDoCampoCheckpoint');
        return null;
    }
    return cp;
}

function clearCheckpoint() {
    localStorage.removeItem('vidasDoCampoCheckpoint');
}

function restoreFromCheckpoint(cp) {
    G.farm = cp.farm;
    G.species = cp.species;
    G.audience = cp.audience;
    G.money = cp.money;
    G.score = cp.score;
    G.hearts = cp.hearts;
    G.survival = cp.survival;
    G.stationIdx = cp.stationIdx;
    G.streak = cp.streak || 0;
    G.stats = cp.stats || { hitsByTag: {}, missesByTag: {}, hypothermiaSaved: 0, colostrumFails: 0 };
    G.mgIodoDone = cp.mgIodoDone;
    G.mgColostroDone = cp.mgColostroDone;
    G.mgHipoDone = cp.mgHipoDone;
    G.mgDietaDone = cp.mgDietaDone;
    G.mgFeedingDone = cp.mgFeedingDone || false;
}

function resumeGame() {
    const cp = loadCheckpoint();
    if (!cp) return;
    restoreFromCheckpoint(cp);
    G.globalStartTime = Date.now();
    G.globalTotalSeconds = 0;
    if (G.timerRef) clearInterval(G.timerRef);
    G.timerRef = setInterval(() => {
        const elapsed = Math.floor((Date.now() - G.globalStartTime) / 1000);
        G.globalTotalSeconds = elapsed;
        const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('hud-timer').textContent = m + ':' + s;
    }, 1000);

    // Se havia progresso dentro da estação, pula a intro e vai direto para a pergunta correta
    const savedQuestionIdx = cp.questionIdx || 0;
    if (savedQuestionIdx > 0) {
        const stId = STATIONS[G.stationIdx].id;
        stationQuestions = getQuestionsForProfile(stId, G.species, G.audience);
        G.questionIdx = Math.min(savedQuestionIdx, stationQuestions.length - 1);
        G.dotHistory = cp.dotHistory || [];
        updateHUD();
        renderQuestion();
        switchScreen('screen-quiz');
    } else {
        loadStation();
    }
}

function dismissCheckpoint() {
    clearCheckpoint();
    document.getElementById('resume-banner').style.display = 'none';
}

function calcMedalCount() {
    let count = 0;
    if (Math.round(G.survival) >= 90) count++;
    if (G.money >= 250) count++;
    if ((G.stats.hitsByTag['colostro'] || 0) >= 1 && (G.stats.missesByTag['colostro'] || 0) === 0) count++;
    if (G.hearts === 5) count++;
    return count;
}

function saveToRanking(score, survival) {
    let rank = JSON.parse(localStorage.getItem('vidasDoCampoRank')) || [];

    const totalSecs = G.globalTotalSeconds;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const tempoFormatado = `${mins}m${secs.toString().padStart(2,'0')}s`;

    const profileLabels = { leigo: '🌱', estudante: '📚', veterinario: '🩺' };
    const speciesLabel = G.species === 'Bovinos' ? '🐄' : '🐑';

    rank.push({
        farm: G.farm,
        score: score,
        surv: survival,
        date: new Date().toLocaleDateString('pt-BR'),
        profile: G.audience,
        profileIcon: profileLabels[G.audience] || '?',
        species: G.species,
        speciesIcon: speciesLabel,
        time: tempoFormatado,
        money: G.money,
        medals: calcMedalCount()
    });

    rank.sort((a, b) => b.score - a.score);
    rank = rank.slice(0, 10);
    localStorage.setItem('vidasDoCampoRank', JSON.stringify(rank));
}

function showRanking() {
    const rank = JSON.parse(localStorage.getItem('vidasDoCampoRank')) || [];
    const list = document.getElementById('ranking-list');

    if (rank.length === 0) {
        list.innerHTML = '<p style="color: var(--text2); text-align: center; padding: 30px 16px; font-size:0.9rem;">Nenhuma fazenda registrada ainda.<br><span style="font-size:0.8rem; opacity:0.6;">Complete sua primeira partida para entrar no ranking.</span></p>';
    } else {
        const medals = ['🥇','🥈','🥉'];
        list.innerHTML = rank.map((r, i) => {
            const bg = i === 0 ? 'rgba(232,160,32,0.08)' : i === 1 ? 'rgba(200,200,200,0.05)' : i === 2 ? 'rgba(180,120,60,0.05)' : 'transparent';
            const medalIcons = r.medals > 0 ? '🏅'.repeat(Math.min(r.medals, 4)) : '';
            return `
            <div style="display:flex; justify-content:space-between; padding:14px 12px; border-bottom:1px solid var(--border); align-items:center; background:${bg}; border-radius: ${i===0?'12px 12px':'0'} 0 0;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.3rem; min-width:28px; text-align:center;">${medals[i] || '#'+(i+1)}</span>
                    <div>
                        <strong style="color:var(--green2); font-size:0.95rem;">${r.farm}</strong>
                        <div style="font-size:0.72rem; color:var(--text2); margin-top:2px;">
                            ${r.speciesIcon || ''} ${r.species || ''} · ${r.profileIcon || ''} ${r.date}
                            ${r.time ? ' · ⏱️ ' + r.time : ''}
                        </div>
                        ${medalIcons ? '<div style="font-size:0.75rem; margin-top:2px;">'+medalIcons+'</div>' : ''}
                    </div>
                </div>
                <div style="text-align:right; min-width:70px;">
                    <div style="font-weight:bold; color:var(--amber); font-size:1rem;">${r.score} pts</div>
                    <div style="font-size:0.8rem; color:var(--text2);">${r.surv}% vivos</div>
                    ${r.money != null ? '<div style="font-size:0.75rem; color:var(--green2);">R$ '+r.money+'</div>' : ''}
                </div>
            </div>`;
        }).join('');
    }
    switchScreen('screen-ranking');
}

function closeRanking() { 
    switchScreen(G.prevScreen || 'screen-splash'); 
}

/* ───────────────────────────────────────
   SONS (Web Audio API)
─────────────────────────────────────── */
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playSound(type) {
    if (G.muted) return; 
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'correct') {
        const freqs = [523, 659, 784, 1047];
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            g.gain.setValueAtTime(0, now + i * 0.1);
            g.gain.linearRampToValueAtTime(0.18, now + i * 0.1 + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    } else if (type === 'wrong') {
        const freqs = [350, 280];
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            g.gain.setValueAtTime(0, now + i * 0.12);
            g.gain.linearRampToValueAtTime(0.14, now + i * 0.12 + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.3);
        });
    } else if (type === 'hint') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.12);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.12, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.28);
    } else if (type === 'minigame_start') {
        const notes = [392, 523, 659, 523, 659, 784];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            g.gain.setValueAtTime(0, now + i * 0.08);
            g.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.03);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.18);
        });
    } else if (type === 'minigame_win') {
        const notes = [523, 659, 784, 1047, 1047];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            g.gain.setValueAtTime(0, now + i * 0.12);
            g.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.35);
        });
    } else if (type === 'minigame_lose') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.5);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.65);
    }
}

/* ───────────────────────────────────────
   DIA / NOITE
─────────────────────────────────────── */
let isNight = false;
function toggleDayNight() {
    isNight = !isNight;
    const bg = document.querySelector('.splash-bg');
    const screen = document.getElementById('screen-splash');
    const btn = document.getElementById('btn-day-night');
    const sun = document.getElementById('splash-sun');
    const moon = document.getElementById('splash-moon');
    const stars = document.getElementById('splash-stars');

    if (isNight) {
        bg.classList.add('night');
        screen.classList.add('night-text');
        btn.textContent = '☀️';
        if (sun) { sun.style.opacity = '0'; sun.style.animation = 'none'; }
        if (moon) moon.style.opacity = '1';
        if (stars) stars.querySelectorAll('.splash-star').forEach(s => {
            s.style.animationPlayState = 'running';
            s.style.opacity = '';
        });
    } else {
        bg.classList.remove('night');
        screen.classList.remove('night-text');
        btn.textContent = '🌙';
        if (sun) { sun.style.opacity = ''; sun.style.animation = 'sunPulse 3s ease-in-out infinite'; }
        if (moon) moon.style.opacity = '0';
        if (stars) stars.querySelectorAll('.splash-star').forEach(s => {
            s.style.animationPlayState = 'paused';
            s.style.opacity = '0';
        });
    }
}

(function init() {
    updateHUD();

    // Gerar estrelas animadas no splash
    (function createStars() {
        const container = document.getElementById('splash-stars');
        if (!container) return;
        const count = 40;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'splash-star';
            star.style.cssText =
                'left: ' + (Math.random() * 100) + '%;' +
                'top: ' + (Math.random() * 60) + '%;' +
                'width: ' + (Math.random() * 2 + 1) + 'px;' +
                'height: ' + (Math.random() * 2 + 1) + 'px;' +
                'animation-delay: ' + (Math.random() * 3) + 's;' +
                'animation-duration: ' + (2 + Math.random() * 2) + 's;' +
                'animation-play-state: paused; opacity: 0;';
            container.appendChild(star);
        }
    })();

    // Verificar checkpoint ao carregar
    const cp = loadCheckpoint();
    if (cp) {
        const banner = document.getElementById('resume-banner');
        const info = document.getElementById('resume-info');
        if (banner && info) {
            const stNames = ['Gestação', 'Colostro', 'Hipotermia', 'Infecções', 'Nutrição', 'Vacinação', 'Gestão'];
            const specLabel = cp.species === 'Bovinos' ? '🐄' : '🐑';
            info.textContent = specLabel + ' ' + cp.farm + ' · Etapa ' + (cp.stationIdx + 1) + '/7: ' + (stNames[cp.stationIdx] || '') + ' · ' + cp.score + ' pts';
            banner.style.display = 'block';
        }
    }
})();
