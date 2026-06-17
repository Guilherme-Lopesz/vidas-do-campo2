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
        "id": 10101, "station": 1, "species": "all", "audience": "leigo", "difficulty": 1, "type": "conceitual", "tags": ["gestacao", "tempo", "biologia"],
        "question": "🐄 Qual é o período médio de gestação de uma vaca e de uma ovelha, respectivamente?",
        "options": ["9 meses e meio para a vaca | 5 meses para a ovelha", "6 meses para a vaca | 9 meses para a ovelha", "12 meses para a vaca | 3 meses para a ovelha", "5 meses para a vaca | 5 meses para a ovelha"],
        "correct": 0, "hint": "O tempo da vaca é muito parecido com o dos humanos, enquanto o da ovelha é bem mais curto.",
        "explanation": "A gestação das vacas dura em média 285 dias (aproximadamente 9 meses e meio). Já as ovelhas têm uma gestação mais rápida, durando cerca de 150 dias (5 meses). Conhecer essas datas ajuda o produtor a se preparar para o momento do parto.",
        "funFact": "Assim como nos humanos, fatores como a raça do animal e se a cria é macho ou fêmea podem adiantar ou atrasar o parto em alguns dias!"
    },
    {
        "id": 10102, "station": 1, "species": "all", "audience": "leigo", "difficulty": 2, "type": "prevencao", "tags": ["alimentacao", "gordura", "manejo"],
        "question": "Se uma vaca ou ovelha chegar muito magra ou muito gorda no momento do parto, o que pode acontecer?",
        "options": ["Não muda nada, o filhote nasce saudável de qualquer forma.", "Animais muito gordos ou magros têm mais chances de ter partos difíceis e doenças após o nascimento.", "Animais magros sempre produzem mais leite.", "Animais gordos nunca têm problemas de parto."],
        "correct": 1, "hint": "O equilíbrio é a chave. Extremos na saúde da mãe afetam diretamente o nascimento.",
        "explanation": "O Escore de Condição Corporal (ECC) ideal ao parto é entre 3,0 e 3,5 (escala de 1 a 5). Animais muito gordos (ECC > 3,75) mobilizam gordura em excesso após o parto, sobrecarregando o fígado e levando à cetose e lipidose hepática. Animais muito magros (ECC < 2,5) chegam sem reservas e não conseguem sustentar o pico de lactação, gerando Balanço Energético Negativo severo. Em ambos os casos, o risco de doenças metabólicas perigosas no pós-parto — como cetose, hipocalcemia e retenção de placenta — aumenta significativamente, comprometendo a mãe e o filhote.",
        "funFact": "O termo técnico usado por veterinários para avaliar a gordura do animal visualmente se chama Escore de Condição Corporal (ECC)."
    },
    {
        "id": 10103, "station": 1, "species": "Ovinos", "audience": "leigo", "difficulty": 3, "type": "prevencao", "tags": ["ovelha", "gemeos", "energia"],
        "question": "Maria percebeu que sua ovelha, que está esperando filhotes gêmeos e está muito magra, começou a se afastar do bando, andar em círculos e parecer cega na última semana de gestação. O que isso indica?",
        "options": ["A ovelha está apenas procurando um lugar calmo para dar à luz.", "Ela está sofrendo de uma grave falta de energia por causa dos filhotes, chamada Toxemia da Prenhez.", "A ovelha comeu alguma planta venenosa no pasto.", "É um comportamento completamente normal de ovelhas experientes."],
        "correct": 1, "hint": "Gerar dois filhotes ao mesmo tempo exige muita energia da mãe. Se ela não comer o suficiente, o corpo dela entra em colapso.",
        "explanation": "A Toxemia da Prenhez, também conhecida como a doença da gestação gemelar, acontece quando a ovelha não consegue comer a quantidade de energia que os dois filhotes exigem. O corpo começa a queimar gordura muito rápido, gerando toxinas que afetam o cérebro do animal.",
        "funFact": "Essa doença é uma emergência! Se não tratada rapidamente com fontes de energia rápida indicadas por um veterinário, a mãe e os filhotes podem morrer."
    },
    {
        "id": 10104, "station": 1, "species": "Bovinos", "audience": "leigo", "difficulty": 1, "type": "prevencao", "tags": ["maternidade", "limpeza", "parto"],
        "question": "🐄 Qual o local mais seguro e higiênico para a vaca dar à luz na fazenda?",
        "options": ["Em uma baia fechada, escura e sem troca de cama por vários meses.", "Um piquete-maternidade limpo, com pasto seco, boa sombra, água fresca e isolado de outros animais adultos.", "No mesmo curral de ordenha com lama, onde passam todas as vacas do rebanho diariamente.", "Em qualquer área de declive acentuado ou perto de rios e atoleiros."],
        "correct": 1, "hint": "O recém-nascido cai direto no chão ao nascer. Se a terra estiver suja de fezes, as bactérias atacam o filhote imediatamente.",
        "explanation": "O piquete-maternidade é uma área reservada para garantir o bem-estar da mãe e isolá-la do estresse do restante do rebanho. Um ambiente limpo e com pasto evita que o bezerro, que nasce sem defesas, entre em contato direto com lama e fezes, reduzindo drasticamente o risco de infecções graves logo nos primeiros minutos de vida.",
        "funFact": "Sabia que o estresse causado por barulho, circulação de máquinas ou cães pastores no momento do parto pode fazer a vaca liberar adrenalina, o que chega a atrasar ou interromper as contrações do parto?"
    },
    {
        "id": 10201, "station": 1, "species": "all", "audience": "estudante", "difficulty": 1, "type": "interpretacao", "tags": ["ecc", "nutricao", "peripartal"],
        "question": "Durante a avaliação de um rebanho leiteiro no pré-parto, qual o Escore de Condição Corporal (ECC) considerado ideal para vacas holandesas na escala de 1 a 5?",
        "options": ["Entre 1,5 e 2,0 (Magra)", "Entre 3,0 e 3,25 (Moderada)", "Entre 4,0 e 4,5 (Gorda)", "A escala varia de acordo com a produção de leite anterior, não havendo padrão."],
        "correct": 1, "hint": "Buscamos o equilíbrio para evitar tanto a mobilização excessiva de gordura quanto a falta de reservas para o pico de lactação.",
        "explanation": "O escore ideal ao parto para vacas de leite está entre 3,0 e 3,25. Animais que parem abaixo de 3,0 têm menor pico de lactação por falta de reserva energética. Animais que parem acima de 3,5 têm redução drástica no consumo de matéria seca (CMS) no pós-parto, predispondo a distocias e doenças metabólicas.",
        "funFact": "A perda de mais de 0,5 pontos de ECC no pós-parto precoce está diretamente associada ao aumento do período de serviço e queda na taxa de concepção."
    },
    {
        "id": 10202, "station": 1, "species": "Ovinos", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["fisiologia", "metabolismo", "ovinos"],
        "question": "Qual a principal alteração fisiopatológica que desencadeia os sintomas neurológicos na Toxemia da Prenhez em ovelhas?",
        "options": ["Hipocalcemia severa decorrente da calcificação dos ossos fetais.", "Hipoglicemia acentuada associada à neurotoxicidade por corpos cetônicos (hipercetonemia).", "Hipertensão portal devido à compressão uterina sobre a veia cava inferior.", "Uremia aguda por falência renal compressiva."],
        "correct": 1, "hint": "O cérebro dos ruminantes é altamente dependent de glicose. Na falta dela, o metabolismo lipídico alternativo gera subprodutos voláteis.",
        "explanation": "A alta demanda por glicose pelos fetos no terço final da gestação, associada à redução do espaço ruminal, induz um Balanço Energético Negativo (BEN). A intensa lipólise satura o fígado, levando à produção excessiva de corpos cetônicos (acetoacetato e beta-hidroxibutirato) e hipoglicemia severa, afetando o sistema nervoso central.",
        "funFact": "Diferente dos humanos, os tecidos periféricos dos ruminantes utilizam predominantemente acetato e propionato como fonte energética, poupando a glicose quase que exclusivamente para o útero gravídico e tecido nervoso."
    },
    {
        "id": 10203, "station": 1, "species": "Bovinos", "audience": "estudante", "difficulty": 3, "type": "caso_clinico", "tags": ["anestro", "dietas_anionicas", "minerais"],
        "question": "Um produtor relata alta incidência de retenção de placenta e hipocalcemia clínica (Febre do Leite) em suas vacas. Ao analisar o manejo pré-parto, você percebe o uso de dietas ricas em potássio (feno de alfafa). Qual a justificativa fisiológica para o problema?",
        "options": ["O potássio inibe diretamente a absorção intestinal de cálcio por competição activa.", "O excesso de potássio causa alcalose metabólica, reduzindo a sensibilidade dos receptores biológicos ao Paratormônio (PTH).", "O potássio destrói as células da glândula paratireoide, impedindo a síntese de PTH.", "Dietas ricas em potássio aceleram a excreção renal de cálcio antes do parto."],
        "correct": 1, "hint": "O PTH precisa de um ambiente com pH sanguíneo levemente acidificado para que seus receptores mudem de conformação e atuem nos ossos e rins.",
        "explanation": "Dietas ricas em cátions (como o Potássio K+) induzem alcalose metabólica nas vacas. A alcalose altera a configuração dos receptores teciduais para o PTH, impedindo que o organismo mobilize eficientemente o cálcio dos ossos para o sangue no momento do parto, culminando na hipocalcemia e atonia uterina (causa da retenção placentária).",
        "funFact": "É por isso que na nutrição moderna de vacas no pré-parto utilizam-se os famosos 'sais aniônicos' (cloretos e sulfatos) para induzir uma leve acidose metabólica controlada."
    },
    {
        "id": 10301, "station": 1, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["terapeutica", "cetose", "obstetricia"],
        "question": "CASO CLÍNICO: Uma vaca multípara da raça Jersey, com 280 dias de gestação e ECC de 4,25, apresenta-se em decúbito esternal, apática, com tremores musculares periféricos e pupilas responsivas lentas. O proprietário aplicou gluconato de cálcio SC sem sucesso. Qual a conduta imediata recomendada?",
        "options": ["Induzir o parto com dexametasona e prostaglandina, associando infusão rápida de cálcio a 50% IV.", "Mensurar BHB e cálcio ionizável; instituir infusão lenta de Gluconato de Cálcio 20% (IV) sob monitoramento cardíaco, associado a propilenoglicol (VO) e glicose hipertônica (IV).", "Realizar cesariana de emergência imediata, sem triagem laboratorial prévia, devido ao alto risco de distocia.", "Administrar ocitocina IV associada a flunixin meglumine para o controle imediato dos tremores musculares."],
        "correct": 1, "hint": "Lembre-se da sobreposição de síndromes metabólicas (hipocalcemia crônica + cetose pré-parto) em raças altamente produtivas com alto ECC.",
        "explanation": "Vacas gordas no pré-parto imediato podem desenvolver Cetose Pré-parto concomitante com Hipocalcemia Subclínica/Clínica. A terapia requer infusão lenta de cálcio IV para restabelecer a contratilidade muscular (sempre monitorando o ritmo cardíaco para evitar parada em sístole), aliada ao fornecimento de precursores glicogênicos (propilenoglicol) e glicose para frear a lipólise severa que gera a hipercetonemia.",
        "funFact": "A raça Jersey possui menor número de receptores para a Vitamina D ativa no intestino em comparação à raça Holandesa, tornando-a geneticamente muito mais predisposta à Febre do Leite."
    },
    {
        "id": 10302, "station": 1, "species": "Ovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["aborto", "zoonose", "diagnostico_diferencial"],
        "question": "Uma propriedade de ovinos apresenta um surto de abortamentos no terço final da gestação, acompanhado de placentite necrótica focal com cotilédones em aspecto de 'molho de tomate'. Algumas ovelhas dão à luz cordeiros fracos que morrem em 48 horas. Qual o diagnóstico e conduta de biosseguridade?",
        "options": ["Brucelose ovina (Brucella ovis); isolar as matrizes e introduzir vacinação imediata com a cepa RB51.", "Toxoplasmose ovina (Toxoplasma gondii); isolar as ovelhas que abortaram, queimar os restos placentários, enviar sorologia/PCR e proibir o acesso de felinos jovens às fontes de alimento.", "Leptospirose aguda; banhar o lote com soluções iodadas e realizar antibioticoterapia oral em massa com metronidazol.", "Deficiência severa de cobre e cobalto; aplicar suplementação mineral injetável imediata e suspender o volumoso."],
        "correct": 1, "hint": "Lembre-se de que os felinos são os hospedeiros definitivos deste parasita e eliminam oocistos que contaminam a pastagem e a ração das ovelhas.",
        "explanation": "O aspecto de necrose focal nos cotilédones placentários lembrando 'molho de tomate' ou 'purê de maçã' é patognomônico da Toxoplasmose em pequenos ruminantes. Por ser uma zoonose severa, fetos e placentas devem ser manipulados com EPIs e descartados por incineração. O controle foca em impedir que gatos (especialmente filhotes, que eliminam mais oocistos) tenham acesso aos galpões de armazenamento de ração e fontes de água.",
        "funFact": "Ao contrário das vacas, onde a Brucelose causa abortos em massa, a infecção por Brucella ovis em ovelhas raramente causa aborto, sendo o principal sintoma a epididimite e infertilidade nos carneiros (machos)."
    },

    // --- ESTAÇÃO 2: COLOSTRO ---
    {
        "id": 20101, "station": 2, "species": "all", "audience": "leigo", "difficulty": 1, "type": "conceitual", "tags": ["colostro", "leite", "protecao"],
        "question": "🍼 O que é o colostro e qual a sua principal função para o filhote que acabou de nascer?",
        "options": ["È um leite fraco que serve apenas para hidratar a cria nas primeiras semanas.", "È o primeiro leite da mãe, rico em energia e anticorpos, funcionando como a primeira 'vacina' natural do filhote.", "È uma secreção perigosa que deve ser descartada antes do filhote mamar.", "È um alimento artificial que substitui o leite de transição."],
        "correct": 1, "hint": "Os filhotes nascem sem nenhuma proteção contra as bactérias do ambiente. Eles dependem 100% desse primeiro alimento.",
        "explanation": "O colostro é o primeiro leite produzido pela mãe logo após o parto. Ele é altamente concentrado em nutrientes, gorduras e, principalmente, em imunoglobulinas (anticorpos), que protegem o recém-nascido contra doenças infecciosas até que seu próprio corpo aprenda a se defender.",
        "funFact": "Ao contrário dos bebês humanos, que recebem proteção da mãe ainda dentro do útero pela placenta, os bezerros e cordeiros nascem com 'zero' defesas corporais!"
    },
    {
        "id": 20102, "station": 2, "species": "Bovinos", "audience": "leigo", "difficulty": 2, "type": "aplicacao", "tags": ["tempo", "absorcao", "bezerro"],
        "question": "Qual é o tempo limite ideal para que um bezerro mame o colostro pela primeira vez para garantir o máximo de proteção?",
        "options": ["Nas primeiras 2 horas de vida.", "Até o segundo dia após o nascimento.", "Apenas após 24 horas de vida, quando o estômago estiver maduro.", "Qualquer momento dentro della primeira semana de vida."],
        "correct": 0, "hint": "O intestino do filhote funciona como uma janela aberta que vai se fechando muito rápido após o nascimento.",
        "explanation": "As primeiras 2 horas são de ouro! O intestino do recém-nascido consegue absorver as defesas do colostro inteiras diretamente para o sangue. Após 6 horas, essa capacidade cai pela metade, e após 24 horas, a janela se fecha completamente, e o colostro não protege mais o sangue do animal.",
        "funFact": "Se o filhote não receber o colostro nas primeiras horas, ele pode sofrer de Falha de Transferência de Imunidade Passiva (FTIP), ficando vulnerável a qualquer bactéria boba do ambiente."
    },
    {
        "id": 20103, "station": 2, "species": "all", "audience": "leigo", "difficulty": 3, "type": "aplicacao", "tags": ["banco_de_colostro", "congelamento", "manejo"],
        "question": "Se a mãe do filhote morrer no parto ou não produzir colostro, qual a melhor alternativa de emergência?",
        "options": ["Dar leite de caixinha integral morno com bastante açúcar de cozinha.", "Utilizar colostro descongelado de um 'banco de colostro' da própria fazenda, que foi guardado de outra mãe saudável.", "Fornecer chá de camomila morno para acalmar o filhote até o dia seguinte.", "Deixar o filhote mamar em uma fêmea que já está dando leite normal há mais de 3 meses."],
        "correct": 1, "hint": "O substituto precisa ter os mesmos anticorpos protetores que a mãe daria. Açúcar ou leite velho não têm defesas contra doenças.",
        "explanation": "Ter um banco de colostro congelado na fazenda salva vidas. O colostro de vacas ou ovelhas saudáveis pode ser armazenado no congelador por até 1 ano. Quando um filhote órfão nasce, esse colostro guardado é descongelado lentamente e garante a imunidade que ele precisa.",
        "funFact": "O colostro nunca deve ser descongelado no micro-ondas ou em água fervendo! O calor excessivo queima e destrói os anticorpos (proteínas). O correto é descongelar em banho-maria morno (menos de 50°C)."
    },
    {
        "id": 20201, "station": 2, "species": "all", "audience": "estudante", "difficulty": 1, "type": "imunologia", "tags": ["imunologia", "igg", "placenta"],
        "question": "Por que os bezerros e cordeiros dependem exclusivamente do colostro para a aquisição de imunoglobulinas G (IgG), diferentemente dos primatas?",
        "options": ["Porque o sistema imune dos ruminantes destrói os anticorpos maternos via circulação fetal.", "Devido ao tipo de placenta dos ruminantes (sinepiteliocorial), que impede a passagem de macromoléculas proteicas durante a gestação.", "Porque os filhotes só ativam a produção de linfócitos após o estímulo mecânico da mamada.", "Pelo fato de o colostro de ruminantes possuir pH ácido que ativa os anticorpos estocados no fígado fetal."],
        "correct": 1, "hint": "Observe a quantidade de camadas celulares que separam o sangue da mãe do sangue do feto na estrutura uterina dessas espécies.",
        "explanation": "A placenta dos ruminantes é do tipo Sinepiteliocorial (ou Epiteliocorial modificada), possuindo seis camadas de tecidos que separam a circulação materna da fetal. Essa barreira física impede totalmente a passagem de grandes proteínas, como as imunoglobulinas, fazendo com que o neonato nasça em estado de agamaglobulinemia (sem anticorpos circulantes).",
        "funFact": "Os cães e gatos possuem placenta endoteliocorial, permitindo que cerca de 5% a 10% dos anticorpos passem durante a gestação, enquanto os humanos (hemocorial) recebem quase 100% via placenta."
    },
    {
        "id": 20202, "station": 2, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "interpretacao", "tags": ["colostrometro", "refratometro", "qualidade"],
        "question": "Ao utilizar um refratômetro de Brix para avaliar a qualidade do colostro bovino na fazenda, qual o valor de corte em porcentagem (%) que indica um colostro de excelente qualidade (superior a 50 mg/mL de IgG)?",
        "options": ["Abaixo de 18% Brix", "Entre 19% e 21% Brix", "Igual ou superior a 22% Brix", "O refratômetro de Brix avalia apenas açúcar, não servindo para anticorpos."],
        "correct": 2, "hint": "Um valor alto de Brix correlaciona-se diretamente com uma alta densidade de proteínas totais na secreção.",
        "explanation": "Um valor de >= 22% no Refratômetro de Brix indica um colostro de alta qualidade, contendo pelo menos 50 g de IgG por litro. Colostros abaixo desse valor devem ser descartados (ou fornecidos apenas para animais mais velhos como nutrição simples) e substituídos por colostro de banco com qualidade validada.",
        "funFact": "O colostrómetro tradicional de vidro avalia a densidade baseado na gravidade específica, mas sofre interferência direta se o colostro estiver frio ou quente demais, enquanto o refratômetro de Brix exige apenas duas gotas e é super estável!"
    },
    {
        "id": 20203, "station": 2, "species": "Bovinos", "audience": "estudante", "difficulty": 3, "type": "interpretacao", "tags": ["refratometro", "proteina_serica", "ftip"],
        "question": "Para monitorar se o protocolo de colostragem de uma fazenda leiteira está funcionando, coletou-se o sangue de bezerros entre 2 e 5 dias de vida para mensurar a Proteína Sérica Total (PST) via refratômetro clínico. Qual valor indica que os animais receberam uma imunidade passiva segura?",
        "options": ["Valores abaixo de 4,5 g/dL.", "Valores entre 4,6 e 5,1 g/dL.", "Valores iguais ou superiores a 5,5 g/dL (ou 8,4% Brix no soro).", "O sangue de neonatos não possui proteínas quantificáveis no refratômetro clínico."],
        "correct": 2, "hint": "Buscamos um patamar de proteínas totais elevado no sangue, pois a maior parte desse valor nesse estágio corresponde às imunoglobulinas absorvidas do colostro.",
        "explanation": "A mensuração de Proteína Sérica Total (PST) por refratometria é o método de campo padrão para diagnosticar a Falha de Transferência de Imunidade Passiva (FTIP). Valores de PST >= 5,5 g/dL em bezerros hidratados correlacionam-se com níveis seguros de IgG no sangue (> 10 mg/mL). Níveis abaixo de 5,0 g/dL indicam falha crítica na colostragem.",
        "funFact": "Bezerros com FTIP têm até duas vezes mais episódios de diarreia e pneumonia e apresentam menor ganho de peso diário até a desmama, mesmo recebendo ração de alta qualidade depois."
    },
    {
        "id": 20301, "station": 2, "species": "Bovinos", "audience": "veterinario", "difficulty": 2, "type": "calculo", "tags": ["dosagem", "manejo", "imunidade"],
        "question": "Deseja-se colostrar um bezerro neonato da raça Holandesa com peso vivo estimado em 40 kg nas primeiras 2 horas de vida. Sabendo que a recomendação técnica atual para garantir a transferência de imunidade passiva eficiente é de fornecer 10% do peso vivo na primeira mamada, qual o volume exato a ser administrado?",
        "options": ["2,0 Litros", "4,0 Litros", "6,0 Litros", "1,5 Litros"],
        "correct": 1, "hint": "A recomendação técnica atual é 10% do peso vivo na primeira mamada. Identifique o peso do animal e aplique esse percentual diretamente para encontrar o volume exato em litros.",
        "explanation": "Para um animal de 40 kg, 10% do peso corporal equivale a 4,0 litros de colostro de alta qualidade. Esse volume garante a ingestão mínima de 150 a 200g de IgG puras necessárias para atingir níveis séricos de segurança (> 10 mg/mL de IgG no soro do bezerro após 24h).",
        "funFact": "Fornecer 4 litros via mamadeira pode ser difícil pelo cansaço do neonato; nesses casos, o uso técnico da Sonda Esofágica é altamente recomendado e seguro se posicionado corretamente no esôfago."
    },
    {
        "id": 20302, "station": 2, "species": "Ovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["ftpi", "soro", "ovinos"],
        "question": "CASO CLÍNICO: Um lote de cordeiros de 36 horas apresenta falha generalizada de transferência de imunidade passiva (FTPI) confirmada laboratorialmente (PT < 5,0 g/dL). O rebanho enfrenta um surto ativo de diarreia por E. coli. Qual a conduta emergencial mais eficaz?",
        "options": ["Fornecer 200 mL de colostro bovino via sonda esofágica imediatamente.", "Administrar via intraperitoneal (IP) 20 a 40 mL/kg de plasma ou soro hiperimune homólogo obtido de doadores adultos sadios e vacinados do próprio rebanho.", "Instituir antibioticoterapia preventiva em massa com oxitetraciclina LA e isolar o lote em abrigo aquecido.", "Fornecer substituto comercial de colostro por via oral adicionado de promotores de crescimento."],
        "correct": 1, "hint": "Como a janela de absorção intestinal já fechou (> 24h), anticorpos dados via oral atuarão apenas localmente e não passarão para o sangue.",
        "explanation": "Após 24-36 horas de vida, os enterócitos do neonato já sofreram o processo de 'closure' (fechamento), impedindo a absorção sistêmica de anticorpos por via oral. A única forma de fornecer imunidade humoral imediata para salvar os animais do surto de diarreia é injetando os anticorpos prontos diretamente na cavidade peritoneal (transfusão de plasma/soro), onde serão absorvidos via linfática para o sangue.",
        "funFact": "O soro de doadores da própria fazenda é excelente porque já contém anticorpos específicos contra as bactérias daquele ambiente específico!"
    },

    // --- ESTAÇÃO 3: HIPOTERMIA NEONATAL ---
    {
        "id": 30101, "station": 3, "species": "Ovinos", "audience": "leigo", "difficulty": 1, "type": "prevencao", "tags": ["frio", "cordeiro", "aquecimento"],
        "question": "❄️ Um cordeiro nasceu em uma noite fria e chuvosa. Ele está deitado, tremendo muito, com as orelhas caídas e com a boca gelada. Qual deve ser sua primeira atitude?",
        "options": ["Dar um banho de água fria para ele acordar.", "Secar o filhote imediatamente com panos limpos, levá-lo para um local sem vento e usar uma fonte de calor (como uma lâmpada quente ou caixas de aquecimento).", "Deixá-lo no pasto para que ele aprenda a sobreviver sozinho no tempo.", "Forçar o filhote a correr para esquentar o corpo."],
        "correct": 1, "hint": "Filhotes molhados perdem calor para o vento muito rápido. O calor externo e a secagem protegem a vida dele.",
        "explanation": "Os cordeiros nascem molhados e têm pouca gordura no corpo. Se pegarem vento ou frio, a temperatura do corpo despenca (hipotermia). Secar o filhote tira a umidade que gela a pele, e a fonte de calor ajuda o corpo dele a voltar para a temperatura normal de forma segura.",
        "funFact": "Cavalos e vacas aguentam o frio um pouco melhor, mas os cordeiros nascem muito pequenos e perdem calor até 4 vezes mais rápido!"
    },
    {
        "id": 30102, "station": 3, "species": "Ovinos", "audience": "leigo", "difficulty": 2, "type": "conceitual", "tags": ["comportamento", "frio", "cordeiro"],
        "question": "Além dos tremores, qual comportamento da mãe ovelha aumenta muito o risco de o cordeiro sofrer de frio e fome no pasto?",
        "options": ["Lamber o filhote excessivamente logo após o nascimento.", "Rejeitar o filhote ou não deixá-lo mamar devido à dor no úbere (mamite) ou por ser mãe de primeira viagem (borrega).", "Procurar um abrigo debaixo das árvores para se proteger do sol.", "Emitir balidos para chamar o cordeiro para perto do bando."],
        "correct": 1, "hint": "Se a mãe abandona ou não deixa o filhote mamar, ele perde a sua única fonte interna de energia para produzir calor.",
        "explanation": "A rejeição materna quebra o ciclo de sobrevivência. Sem o colostro, o cordeiro consome suas poucas reservas de gordura marrom em poucas horas. Associado ao vento e frio, o neonato perde a capacidade de ficar em pé, agravando a hipotermia até entrar em coma.",
        "funFact": "Ovelhas jovens que dão à luz cordeiros gêmeos frequentemente abandonam o segundo filhote por pura inexperiência ou exaustão do parto!"
    },
    {
        "id": 30103, "station": 3, "species": "Bovinos", "audience": "leigo", "difficulty": 1, "type": "prevencao", "tags": ["frio", "bezerro", "aquecimento"],
        "question": "❄️ Uma frente fria intensa atingiu a fazenda logo após o nascimento de um bezerro. Além de secá-lo e abrigá-lo, o que é fundamental para ele produzir calor e não morrer de hipotermia?",
        "options": ["Deixá-lo correr livremente pelo pasto para se aquecer.", "Garantir que ele mame o colostro quente nas primeiras horas, pois é o 'combustível' para o corpo dele gerar calor.", "Dar banho com água morna e deixá-lo no sol.", "Apenas colocar uma capa, não precisa mamar."],
        "correct": 1, "hint": "O filhote gasta muita energia para tremer e gerar calor. Ele precisa de uma fonte rica em energia rapidamente.",
        "explanation": "O colostro não é apenas proteção (anticorpos): é altamente energético e rico em gordura. Sem esse combustível, o bezerro esgota suas reservas rapidamente tentando se aquecer, entrando em hipotermia fatal. Atenção crítica: o colostro deve ser aquecido a 38–39°C antes de ser oferecido ao bezerro hipotérmico. Oferecer colostro frio ou temperatura ambiente a um animal com temperatura retal abaixo de 37°C pode agravar a hipotermia central e reduzir a absorção de IgG.",
        "funFact": "Bezerros nascem com uma reserva de gordura muito pequena comparado a outros animais, dependendo quase que totalmente da gordura do colostro nos dias frios!"
    },
    {
        "id": 30201, "station": 3, "species": "Ovinos", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["gordura_marrom", "fisiologia", "termogenese"],
        "question": "Qual o principal mecanismo fisiológico de termogênese química (produção de calor sem tremores) utilizado por cordeiros recém-nascidos nas primeiras horas de vida?",
        "options": ["Fermentação bacteriana acelerada no rúmen.", "Catabolismo do tecido adiposo marrom (gordura marrom) através da ativação da proteína desacopladora 1 (UCP-1).", "Glicogenólise muscular induzida por altos níveis de cortisol materno.", "Vasoconstrição periférica severa mediada por acetilcolina."],
        "correct": 1, "hint": "Trata-se de um tipo especial de tecido gorduroso, altamente vascularizado, localizado ao redor dos rins e do coração do neonato.",
        "explanation": "Nos neonatos de ruminantes, os depósitos de Tecido Adiposo Marrom (TAM) são ativados via noradrenalina sob o estímulo do frio. Isso ativa a UCP-1 (Termogenina) nas mitocôndrias. Em vez de produzir ATP, o TAM consome ácidos graxos liberando diretamente CALOR para a corrente sanguínea.",
        "funFact": "Esse estoque de gordura marrom é limitado e dura apenas cerca de 24 a 48 horas após o nascimento. Se o animal não mamar nesse período, a lenha dessa fogueira acaba!"
    },
    {
        "id": 30202, "station": 3, "species": "Ovinos", "audience": "estudante", "difficulty": 2, "type": "interpretacao", "tags": ["classificacao", "clinica", "hipotermia"],
        "question": "Durante uma triagem clínica em um rebanho ovino no inverno, você avalia um cordeiro com temperatura retal de 37,8°C. Ele apresenta reflexo de sucção presente, porém fraco, e consegue se manter em estação (em pé) com dificuldade. Como se classifica esse quadro?",
        "options": ["Hipotermia severa com esgotamento metabólico total.", "Hipotermia leve a moderada, onde o animal ainda é capaz de deglutir e responder a estímulos térmicos e nutricionais orais.", "Normotermia fisiológica perfeita para a espécie ovina.", "Febre induzida por infecção bacteriana sistêmica precoce."],
        "correct": 1, "hint": "A temperatura normal de um cordeiro saudável varia entre 38,5°C e 40,0°C. Ele está abaixo disso, mas seu reflexo de deglutição ainda funciona.",
        "explanation": "O quadro descreve uma hipotermia moderada (temperatura retal entre 37,0°C e 38,0°C). Como o reflexo de deglutição está preservado e o animal não está em coma hipoglicêmico, o protocolo clínico permite o fornecimento de colostro morno via oral (sonda ou mamadeira) associado ao aquecimento externo progressivo.",
        "funFact": "O uso de banho-maria direto para aquecer cordeiros hipotérmicos é desaconselhado na rotina médica moderna, pois remove o odor do filhote, aumentando a taxa de rejeição da mãe quando ele retorna ao lote."
    },
    {
        "id": 30203, "station": 3, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["gordura_marrom", "fisiologia", "termogenese"],
        "question": "Bezerros neonatos submetidos a estresse por frio intenso acionam a termogênese não-tremulante. Qual o principal tecido responsável por essa produção de calor e qual seu destino metabólico em poucos dias?",
        "options": ["Glicogênio hepático, que perdura por semanas até a formação do rúmen.", "Tecido Adiposo Marrom (TAM), que é consumido rapidamente e esgota-se nos primeiros dias de vida se não houver ingestão de colostro.", "Gordura subcutânea branca, que age como isolante térmico permanente.", "Proteínas musculares, que são degradadas gerando tremores involuntários e calor contínuo."],
        "correct": 1, "hint": "Esse tecido é rico em mitocôndrias e está localizado ao redor dos rins e coração, sendo queimado como 'lenha' térmica.",
        "explanation": "Os bezerros nascem com depósitos de Tecido Adiposo Marrom (TAM) para termogênese química (sem tremores). Porém, essa reserva é muito limitada. Em frio intenso, se o bezerro não mamar, o TAM se esgota em menos de 48 horas, levando à falência térmica.",
        "funFact": "O TAM tem essa cor 'marrom' devido à imensa quantidade de mitocôndrias e vasos sanguíneos, focados exclusivamente em queimar gordura para gerar calor, e não energia (ATP)!"
    },
    {
        "id": 30301, "station": 3, "species": "Ovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["glicose", "intraperitoneal", "emergencia"],
        "question": "CASO CLÍNICO: Cordeiro de 12 horas de vida é encontrado em decúbito lateral em piquete úmido. Temperatura retal de 35,5°C (hipotermia severa) e ausência completa dos reflexos de deglutição e sucção. Qual o protocolo imediato obrigatório?",
        "options": ["Fornecer 100 mL de colostro hiperaquecido a 50°C via sonda esofágica antes do aquecimento.", "Administrar Glicose 20% por via intraperitoneal (10 mL/kg, morna) e, na sequência, instituir aquecimento gradual externo por ar forçado.", "Aplicar dexametasona IM e realizar imersão imediata do neonato em banho-maria a 42°C.", "Efetuar massagem vigorosa em todo o corpo com álcool iodado e administrar solução eletrolítica oral."],
        "correct": 1, "hint": "Pense na sequência correta: o aquecimento externo acelera o metabolismo e aumenta a demanda de combustível. O que precisa ser reposto ANTES de elevar essa demanda em um animal exausto?",
        "explanation": "Cordeiro com hipotermia severa (< 37°C) e há mais de 6 horas de vida esgotou suas reservas de glicogênio e gordura marrom. Aquecê-lo sem corrigir a glicose acelera o metabolismo periférico, consumindo o restinho de açúcar do cérebro, gerando convulsão e morte. O protocolo exige Glicose Intraperitoneal morna para absorção rápida, seguida de aquecimento.",
        "funFact": "A injeção intraperitoneal é feita inserindo a agulha a cerca de 1,5 cm ao lado do umbigo e direcionada para o quadril do animal. É um procedimento de campo simples que salva milhares de cordeiros."
    },
    {
        "id": 30302, "station": 3, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["hipotermia", "fluidoterapia", "emergencia"],
        "question": "CASO CLÍNICO: Bezerro neonato encontrado em decúbito lateral na lama após tempestade noturna. Temperatura retal de 34,5°C (hipotermia severa), bradicardia e reflexo de sucção ausente. Qual o protocolo de reanimação clínica imediata mais indicado?",
        "options": ["Aquecimento externo imediato com ar quente e fornecimento de 3 litros de colostro via sonda esofágica.", "Administrar fluidoterapia intravenosa lenta (solução aquecida a 38-39°C com glicose a 5%), seguida de aquecimento gradual periférico e secagem.", "Aplicação de dexametasona IM e massagem vigorosa com álcool para vasodilatação periférica.", "Fornecimento de leite de transição aquecido via mamadeira e imersão em banho-maria a 45°C."],
        "correct": 1, "hint": "O aquecimento periférico de um animal hipoglicêmico pode causar choque irreversível. Primeiro fornecemos energia direta no sangue, depois o calor.",
        "explanation": "Em hipotermia severa (<35°C), o bezerro esgotou glicogênio e gordura marrom. O reflexo de sucção ausente proíbe a via oral (risco de pneumonia por aspiração). Devemos infundir fluidos aquecidos com glicose via IV para restaurar a perfusão central e a glicemia, antes de aquecer a periferia, evitando o choque hipovolêmico letal periférico ('afterdrop').",
        "funFact": "Aquecer um animal hipotérmico severo sem corrigir a glicose faz os vasos da pele dilatarem, roubando sangue do coração e cérebro, causando morte súbita!"
    },

    // --- ESTAÇÃO 4: INFECÇÕES NEONATAIS ---
    {
        "id": 40101, "station": 4, "species": "all", "audience": "leigo", "difficulty": 1, "type": "prevencao", "tags": ["umbigo", "curativo", "iodo"],
        "question": "🧴 Qual é a forma correta e o produto mais indicado para tratar o umbigo do filhote assim que ele nasce?",
        "options": ["Apenas passar um spray 'mata-bicheira' azul por fora.", "Mergulhar o umbigo inteiro dentro de um copinho com Iodo a 10% por pelo menos 30 segundos, repetindo nos primeiros dias.", "Lavar com água e sabão e cobrir com uma faixa limpa.", "Não precisa fazer nada, o umbigo seca sozinho com o vento."],
        "correct": 1, "hint": "O umbigo quebrado funciona como uma tubulação aberta que vai direto para o coração e fígado do filhote. O produto precisa desinfetar e secar essa estrutura.",
        "explanation": "O umbigo é a principal porta de entrada para bactérias perigosas. O Iodo de 7% a 10% (como a tintura de iodo) mata os germes e desidrata o cordão (faz o umbigo 'secar' e cair). Mergulhar garante que o líquido entre em todo o canal, protegendo o filhote de infecções graves sem agredir quimicamente a pele abdominal.",
        "funFact": "Infecções de umbigo mal cuidadas podem causar uma doença chamada 'mal do caruara' ou 'junta boba', onde as bactérias viajam pelo sangue e se alojam nas articulações do filhote, deixando-o aleijado!"
    },
    {
        "id": 40201, "station": 4, "species": "all", "audience": "estudante", "difficulty": 2, "type": "interpretacao", "tags": ["onfaloflebite", "onfalite", "ultrassonografia"],
        "question": "Um bezerro de 15 dias apresenta flutuação e aumento de volume na região umbilical, dor à palpação e febre intermitente. Quais as estruturas anatômicas internas derivadas do cordão umbilical que podem estar envolvidas nessa infecção (onfaloflebite/onfaloarterite)?",
        "options": ["Apenas a pele externa e o tecido subcutâneo do abdômen.", "A veia umbilical (que vai ao fígado), as duas artérias umbilicais (ligadas às artérias ilíacas) e o úraco (comunicação com a bexiga).", "O ducto colédoco e a artéria mesentérica cranial.", "O estômago verdadeiro (abomaso) e o ligamento falciforme."],
        "correct": 1, "hint": "O cordão umbilical do feto contém vasos sanguíneos de alta importância circulatória e um canal urinário de descarte.",
        "explanation": "A infecção do umbigo pode progredir internamente por quatro caminhos: pela Veia Umbilical (causando abscesso hepático por Onfaloflebite), pelas Artérias Umbilicais (Onfaloarterite) ou pelo Úraco (causando anatomicamente uma cistite ou abscesso uracal). O diagnóstico preciso exige palpação profunda ou ultrassonografia.",
        "funFact": "Quando o úraco não fecha direito devido a infecções, o filhote pode ficar gotejando urina pelo umbigo, uma condição chamada de úraco persistente."
    },
    {
        "id": 40202, "station": 4, "species": "Bovinos", "audience": "estudante", "difficulty": 1, "type": "conceitual", "tags": ["diarreia", "etiologia", "zoonose"],
        "question": "Um lote de bezerros com 8 dias de vida apresenta diarreia amarelada, fétida e com presença de muco. O exame parasitológico revela oocistos de um protozoário zoonótico que causa infecção nas microvilosidades do intestino delgado. Qual o agente causal?",
        "options": ["Eimeria bovis (Coccidiose clássica).", "Cryptosporidium parvum.", "Rotavírus bovino tipo A.", "Strongyloides papillosus."],
        "correct": 1, "hint": "Este agente é famoso por afetar bezerros na primeira e segunda semana de vida e por ser uma causa frequente de diarreia em estudantes de veterinária e tratadores que não lavam as mãos.",
        "explanation": "O Cryptosporidium parvum é um protozoário que causa diarreia severa em animais jovens (geralmente de 5 a 15 dias de idade). Ele destrói os enterócitos, provocando má absorção crônica. É altamente contagioso, resistente aos desinfetantes comuns e possui alto potencial zoonótico (transmissível ao ser humano).",
        "funFact": "Diferente da Coccidiose (Eimeria), que costuma causar diarreia com sangue vivo em animais mais velhos (acima de 3 a 4 semanas), a Criptosporidiose cursa com fezes aquosas de coloração argila ou amarelada em neonatos."
    },
    {
        "id": 40301, "station": 4, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["diarreia", "acidose", "reidratacao"],
        "question": "CASO CLÍNICO: Bezerro de 7 dias apresenta diarreia aquosa profusa há 48 horas, decúbito esternal permanente, perda do reflexo de sucção, enofalmia severa (> 5 mm) e turgor cutâneo de 8 segundos. Qual o diagnóstico hemodinâmico e conduta imediata?",
        "options": ["Desidratação leve (5%) sem distúrbio ácido-base; administrar solução eletrolítica oral a cada 2 horas.", "Desidratação grave (10-12%) com acidose metabólica severa e choque hipovolêmico; instituir fluidoterapia intravenosa imediata com soluções alcalinizantes (Bicarbonato de Sódio 1,3% ou Ringer Lactato).", "Coccidiose aguda com choque endotóxico; realizar aplicação de sulfas IM e suspender o fornecimento hídrico.", "Septicemia secundária por Salmonella; administrar corticoterapia de alta potência e transfusão sanguínea total."],
        "correct": 1, "hint": "Animais caídos com perda de sucção e olhos fundos já perderam mais de 10% do peso em água e estão em acidose severa. A via oral é contraindicada pelo risco de atonia gastrointestinal.",
        "explanation": "O quadro clínico descreve um estado crítico de desidratação severa com choque endotóxico/hipovolêmico e acidose metabólica (causada pela perda de bicarbonato nas fezes e acúmulo de lactato D- e L-). O tratamento de eleição é a reposição volêmica imediata por via IV com soluções alcalinizantes para restaurar a perfusão tecidual e corrigir o pH sanguíneo.",
        "funFact": "A velocidade de hidratação em bezerros pode ser agressiva: pode-se infundir até 80 mL/kg nas primeiras 2 a 4 horas de tratamento sob monitoramento pulmonar."
    },
    {
        "id": 40302, "station": 4, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["septicemia", "meningite", "terapeutica"],
        "question": "Um bezerro de 4 dias apresenta febre (40,8°C), hiperemia de esclera (olhos vermelhos), petéquias em mucosas, opacidade de córnea bilateral (hipópio) e episódios de opistótono (pescoço estendido para trás). Há histórico de falha de colostragem na propriedade. Qual a suspeita diagnóstica e conduta imediata?",
        "options": ["Meningoencefalite por Herpesvírus Bovino tipo 5; instituir isolamento absoluto e aplicar vacina intranasal de emergência.", "Septicemia neonatal com evolução para meningite bacteriana (comum por E. coli ou Salmonella); iniciar antibioticoterapia agressiva com princípios ativos que cruzem a barreira hematoencefálica (como florfenicol ou ceftiofur), associada a anti-inflamatório e suporte hemodinâmico.", "Intoxicação por organofosforados via cordão umbilical; administrar sulfato de atropina IV de 15 em 15 minutos até a remissão total.", "Tetania hipomagnesêmica do neonato; realizar infusão IV rápida de sulfato de magnésio a 50% sem triagem prévia."],
        "correct": 1, "hint": "A opacidade de córnea por deposição de fibrina (hipópio) e os sinais neurológicos agudos em um neonato sem colostro indicam colonização bacteriana sistêmica via circulação.",
        "explanation": "A falha na colostragem permite que bactérias oportunistas intestinais ou umbilicais acessem a corrente sanguínea, gerando septicemia. O agente fixa-se em sítios de eleição: articulações (artrite), olhos (hipópio/uveíte) e meninges (causando os sinais neurológicos descritos). O tratamento exige antimicrobianos bactericidas de amplo espectro com excelente distribuição no líquido cefalorraquidiano.",
        "funFact": "O sinal de opistótono e a rigidez de nuca ocorrem devido ao severo processo inflamatório e aumento da pressão intracraniana nas meninges que recobrem o sistema nervoso central."
    },

    // --- ESTAÇÃO 5: NUTRIÇÃO DA LACTAÇÃO ---
    {
        "id": 50101, "station": 5, "species": "all", "audience": "leigo", "difficulty": 1, "type": "conceitual", "tags": ["leite", "agua", "alimentacao"],
        "question": "🌿 Qual o nutriente mais importante e mais barato que uma mãe em lactação precisa receber em grande quantidade para produzir bastante leite?",
        "options": ["Sal mineral importado.", "Água limpa e fresca à vontade.", "Ração concentrada com alto teor de farelo de soja.", "Vitaminas injetáveis aplicadas diariamente."],
        "correct": 1, "hint": "O leite é composto por mais de 80% deste ingrediente. Se faltar, a produção cai no mesmo dia.",
        "explanation": "A água é o nutriente mais crítico para fêmeas lactantes. Uma vaca de alta produção pode beber mais de 100 a 140 litros de água por dia. Se o acesso à água for difícil ou se a água estiver suja, o consumo cai, reduzindo imediatamente a produção de leite e prejudicando os filhotes.",
        "funFact": "As ovelhas que amamentam gêmeos chegam a aumentar o consumo de água em até 50% em comparação com as que cuidam de apenas um cordeiro!"
    },
    {
        "id": 50102, "station": 5, "species": "Bovinos", "audience": "leigo", "difficulty": 2, "type": "prevencao", "tags": ["alimentacao", "fibra", "leite"],
        "question": "🐄 Para manter a saúde do estômago da vaca em dia e garantir que o leite tenha uma boa quantidade de gordura, o que nunca pode faltar na alimentação dela?",
        "options": ["Apenas ração fina de milho moído à vontade.", "Fibra de boa qualidade, vinda de pasto fresco, capim picado ou silagem bem feita.", "Restos de alimentos domésticos e farelo de trigo puro.", "Óleo de cozinha misturado diretamente na água de beber."],
        "correct": 1, "hint": "A vaca é um ruminante. O estômago dela precisa de partículas compridas (capim) para funcionar e fazer a ruminação ('remoer' o alimento).",
        "explanation": "As vacas precisam de fibra (forragem) para estimular a ruminação e a produção de saliva, que controla a acidez do rúmen. É a fermentação dessa fibra pelas bactérias do estômago que produz os ingredientes que a vaca usa para fabricar a gordura do leite.",
        "funFact": "Se uma vaca comer apenas grãos e ração fina, ela para de ruminar, o estômago fica muito ácido e o teor de gordura do leite despenca, deixando o leite 'aguado'."
    },
    {
        "id": 50201, "station": 5, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["rumen", "fga", "concentrado"],
        "question": "O fornecimento excessivo de concentrados (grãos/amido) para vacas no pós-parto imediato, na tentativa de aumentar a energia da dieta de forma abrupta, predispõe a qual patologia ruminal?",
        "options": ["Alcalose Ruminal por excesso de ureia.", "Acidose Ruminal Subaguda (SARA) devido ao acúmulo de Ácidos Graxos Voláteis (AGVs) e queda do pH ruminal para valores abaixo de 5,5.", "Timpanismo gasoso por falta de motilidade do omaso.", "Paraqueratose intestinal decorrente de deficiência de fibra digestível."],
        "correct": 1, "hint": "Os carboidratos de rápida fermentação são rapidamente digeridos pelas bactérias amylolíticas, gerando ácidos que reduzem o pH do ambiente.",
        "explanation": "O aumento rápido de grãos sem adaptação da microbiota ruminal provoca surtos de fermentação lática e acúmulo de Ácidos Graxos Voláteis. O pH do rúmen cai abaixo de 5,5, destruindo as bactérias celulolíticas (que digerem fibra) e lesionando a parede ruminal, o que pode causar laminite (manqueira) e abcessos hepáticos.",
        "funFact": "A SARA é conhecida como a doença silenciosa dos rebanhos leiteiros modernos de alta produção, pois muitas vezes o único sintoma visível é a oscilação na gordura do leite."
    },
    {
        "id": 50202, "station": 5, "species": "all", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["fisiologia", "lactacao", "curva_de_lactacao"],
        "question": "Fisiologicamente, em qual período após o parto ocorre o 'pico de lactação' (momento de maior produção diária de leite) na maioria das vacas e ovelhas de alta produção?",
        "options": ["Nas primeiras 48 horas após o nascimento, decaindo logo em seguida.", "Entre a 4ª e a 8ª semana pós-parto (aproximadamente 30 a 60 dias), coincidindo com o período de maior desafio metabólico.", "Exclusivamente no sexto mês de lactação, quando o filhote já está desmamado.", "A produção é linear e constante durante todos os 300 dias de lactação, sem oscilações."],
        "correct": 1, "hint": "Este período representa o ápice do estresse nutricional, pois o consumo de alimentos da fêmea ainda não atingiu o máximo, mas a produção de leite sim.",
        "explanation": "O pico de produção de leite ocorre entre 30 e 60 dias pós-parto. O grande desafio zootécnico é que o Pico de Consumo de Matéria Seca (CMS) atrasa, ocorrendo apenas entre 70 e 90 dias. Esse descompasso gera o Balanço Energético Negativo (BEN), forçando a mãe a emagrecer (mobilizar gordura corporal) para sustentar a lactação.",
        "funFact": "É por causa desse BEN fisiológico que vacas que chegam muito magras ao parto não conseguem atingir um bom pico de lactação, reduzindo a produção de todo o restante do ano."
    },
    {
        "id": 50301, "station": 5, "species": "Ovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["hipocalcemia", "ovinos", "terapeutica"],
        "question": "Analise o caso: Ovelha de alta produção, 14 dias pós-parto, apresenta tremores na cabeça, andar rígido, evolução para decúbito esternal com o pescoço em 'S' e ausência de reflexo pupilar. Qual o diagnóstico e conduta indicados?",
        "options": ["Suspeita de Raiva ovina; realizar eutanásia humanitária imediata para coleta de material encefálico.", "Hipocalcemia da Lactação; administrar de 50 a 100 mL de Gluconato de Cálcio a 20% via intravenosa lenta sob monitoramento cardíaco contínuo.", "Polioencefalomalácia severa; aplicar altas doses de Tiamina (Vitamina B1) via intramuscular de 4 em 4 horas.", "Listeriose em estágio inicial; instituir antibioticoterapia massiva com benzilpenicilinas por via subcutânea."],
        "correct": 1, "hint": "A postura em 'S' do pescoço em decúbito é o sinal clássico da paralisia flácida muscular causada pelo esgotamento de cálcio extracelular circulante utilizado na síntese de leite.",
        "explanation": "Embora mais rara em ovelhas do que em vacas, a hipocalcemia pós-parto ocorre em animais com alto potencial genético para lactação ou erros de balanço mineral na dieta. O cálcio é vital para a liberação de acetilcolina na fenda sináptica; sua falta causa bloqueio neuromuscular. A resposta clínica ao gluconato de cálcio IV lento é diagnóstica, com o animal levantando minutos após a aplicação.",
        "funFact": "Durante a aplicação de cálcio intravenoso, o veterinário DEVE manter o estetoscópio no coração do animal. Se houver arritmia ou bradicardia severa, a aplicação deve ser interrompida imediatamente para evitar parada cardíaca em sístole."
    },

    // --- ESTAÇÃO 6: VACINAÇÃO E PREVENÇÃO ---
    {
        "id": 60101, "station": 6, "species": "all", "audience": "leigo", "difficulty": 1, "type": "prevencao", "tags": ["vacina", "mae", "colostro"],
        "question": "💉 Por que é altamente recomendado vacinar as vacas e ovelhas prenhas cerca de 1 mês antes do parto?",
        "options": ["Para fazer a mãe emagrecer antes do parto.", "Para que ela produza um colostro super potente e cheio de anticorpos que vão proteger o filhote assim que ele mamar.", "A vacina serve apenas para proteger a mãe, não influenciando no filhote.", "Para evitar que o leite da mãe azede na ordenha."],
        "correct": 1, "hint": "A mãe transfere os anticorpos que ela fabrica no sangue diretamente para o primeiro leite nas semanas que antecedem o parto.",
        "explanation": "Quando vacinamos a fêmea no terço final da gestação (aproximadamente 30 a 45 dias antes do parto), damos tempo para o corpo dela produzir altos níveis de anticorpos contra doenças graves (como o tétano e as diarreias). Esses anticorpos migram do sangue para o úbere, concentrando-se no colostro que o filhote ingerirá.",
        "funFact": "Essa estratégia inteligente de manejo se chama 'Imunização Materna' ou vacinação de pré-parto, sendo a forma mais barata de proteger os recém-nascidos!"
    },
    {
        "id": 60102, "station": 6, "species": "Bovinos", "audience": "leigo", "difficulty": 2, "type": "prevencao", "tags": ["tristeza_parasitaria", "carrapato", "bezerro"],
        "question": "Muitos bezerros entre 2 e 4 meses de vida começam a ficar tristes, orelhas caídas, com febre alta, anemia (gengivas brancas) e urina escura. Essa doença é transmitida por qual parasita comum?",
        "options": ["Pelas moscas-varejeiras que pousam no lombo do animal.", "Pelo carrapato dos bovinos, que transmite a Tristeza Parasitária Bovina (TPB).", "Por vermes intestinais que o bezerro engole ao comer pasto limpo.", "Pela ingestão de água parada com larvas de mosquito."],
        "correct": 1, "hint": "O controle desse problema exige combater o pequeno inimigo que chupa o sangue do animal e aplicar remédios específicos indicados pelo veterinário.",
        "explanation": "A Tristeza Parasitária Bovina (TPB) é causada por protozoários (Babesia) e bactérias (Anaplasma) transmitidos pela picada do carrapato. Eles destroem os glóbulos vermelhos do sangue do bezerro, provocando anemia severa, fraqueza e febre. Se não tratada a tempo, mata o animal rapidamente.",
        "funFact": "Bezerros de raças europeias (como o Holandês e o Jersey) são muito mais sensíveis à Tristeza Parasitária do que os bezerros de raças zebuínas (como o Nelore)!"
    },
    {
        "id": 60201, "station": 6, "species": "Ovinos", "audience": "estudante", "difficulty": 2, "type": "prevencao", "tags": ["clostridiose", "pulpy_kidney", "toxinas"],
        "question": "Qual das seguintes enfermidades clostridiais é conhecida como 'Doença do Rim Polposo' (Enterotoxemia), comum em cordeiros em crescimento criados intensivamente, cujas mães não foram vacinadas no pré-parto?",
        "options": ["Infecção por Clostridium tetani.", "Enterotoxemia por Clostridium perfringens Tipo D.", "Carbúnculo Sintomático por Clostridium chauvoei.", "Botulismo por Clostridium botulinum Tipo C."],
        "correct": 1, "hint": "Esta bactéria se prolifera rapidamente no intestino quando há excesso de amido ou mudanças bruscas na dieta, liberando a toxina épsilon.",
        "explanation": "O Clostridium perfringens tipo D produz a toxina épsilon sob dietas ricas em concentrado. A toxina causa danos severos nos vasos sanguíneos, levando a edema cerebral e autólise rápida dos rins pós-morte (daí o nome 'rim polposo'). A prevenção ideal é a vacinação das mães no pré-parto para garantir IgG via colostro.",
        "funFact": "Curiosamente, essa doença costuma acometer os melhores e mais gordos cordeiros do lote, ocorrendo de forma fulminante (morte súbita)."
    },
    {
        "id": 60301, "station": 6, "species": "all", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["imunologia", "anticorpos_maternos", "janela_imunologica"],
        "question": "Qual a justificativa fisiológica para evitar a vacinação de cordeiros ou bezerros contra patógenos sistêmicos na primeira semana de vida?",
        "options": ["Incapacidade congênita do sistema imune neonatal em processar e reconhecer antígenos proteicos.", "Neutralização dos antígenos vacinais pelos altos títulos de anticorpos maternos (IgG) circulantes adquiridos via colostro.", "Risco de involução precoce do timo induzida por adjuvantes vacinais oleosos.", "Baixa taxa de absorção farmacocinética no tecido subcutâneo, predispondo a choques anafiláticos."],
        "correct": 1, "hint": "Os anticorpos da mãe circulando no sangue do filhote ligam-se aos antígenos da vacina e os destroem antes que os linfócitos do próprio filhote possam 'aprender' com a vacina.",
        "explanation": "A imunidade passiva (anticorpos maternos) exerce um efeito de feedback negativo na síntese de anticorpos endógenos. Se vacinamos o filhote enquanto o título de anticorpos colostrais está alto, ocorre a neutralização do antígeno vacinal. Deve-se aguardar o declínio natural desses anticorpos (geralmente entre 60 e 90 dias de vida) para iniciar o protocolo vacinal primário.",
        "funFact": "Essa fase onde os anticorpos maternos estão baixando (não protegendo mais contra infecções de campo) mas ainda estão altos o suficiente para anular a vacina chama-se 'Janela de Vulnerabilidade Imunológica'."
    },
    {
        "id": 60302, "station": 6, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["bvd", "pi", "imunologia"],
        "question": "Ao estruturar o controle vacinal para o Vírus da Diarreia Viral Bovinas (BVDV), qual o foco epidemiológico em relação às vacinas aplicadas em fêmeas no pré-parto ou pré-cobertura?",
        "options": ["Aumentar exclusivamente os títulos de IgA na saliva das vacas para bloquear a transmissão horizontal por lambedura.", "Promover a proteção fetal ativa para evitar o nascimento de animais Persistentemente Infectados (PI), que atuam como as principais fontes de infecção e manutenção do vírus no rebanho.", "Induzir uma resposta de hipersensibilidade celular cutânea para repelir vetores biológicos.", "Neutralizar o vírus exclusivamente no lúmen ruminal, impedindo a acidose metabólica secundária."],
        "correct": 1, "hint": "Animais PI nascem quando a mãe é infectada por uma cepa não citopática do BVDV entre os dias 40 e 120 da gestação. O sistema imune fetal reconhece o vírus como 'próprio'.",
        "explanation": "A vacinação estratégica contra BVDV visa blindar o útero gravídico. Se uma matriz gestante sem anticorpos é infectada no início da gestação, o feto torna-se Persistentemente Infectado (PI). Animais PI não produzem anticorpos contra o vírus, eliminando bilhões de partículas virais pelas secreções durante toda a vida. Vacinar protege o feto e quebra a cadeia epidemiológica.",
        "funFact": "Um animal PI frequentemente tem aspect normal e saudável ao nascer, mas costuma desenvolver a fatal 'Doença das Mucosas' entre os 6 e 24 meses de idade, cursando com úlceras em todo o trato digestivo."
    },

    // --- ESTAÇÃO 7: GESTÃO E INDICADORES ---
    {
        "id": 70101, "station": 7, "species": "all", "audience": "leigo", "difficulty": 1, "type": "interpretacao", "tags": ["meta", "mortalidade", "sucesso"],
        "question": "📊 Em uma fazenda de gado ou ovelhas bem administrada, qual é a taxa máxima aceitável de mortalidade de filhotes no primeiro mês de vida?",
        "options": ["Até metade dos filhotes nascidos (50%).", "O ideal é ficar abaixo de 5% a 8% do total de nascidos vivos.", "Perder até 25% é considerado normal em qualquer fazenda.", "A mortalidade não importa, desde que o preço da carne esteja alto."],
        "correct": 1, "hint": "A meta deve ser sempre baixa. Perder muitos filhotes indica falhas graves no manejo e prejuízo financeiro certo.",
        "explanation": "Propriedades eficientes mantêm a Taxa de Mortalidade Neonatal (TMN) abaixo de 5% para bezerras leiteiras e abaixo de 8% para cordeiros. Valores acima disso acendem o sinal de alerta para revisar a higiene das baias, a colostragem e o tratamento de umbigo.",
        "funFact": "Reduzir a mortalidade de 15% para 5% pode salvar dezenas de animais por ano, pagando com folga os custos de contratação de assistência técnica veterinária!"
    },
    {
        "id": 70201, "station": 7, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "calculo", "tags": ["tmn", "indicador", "zootecnia"],
        "question": "Uma propriedade leiteira registrou o nascimento de 120 bezerras vivas durante o ano. Destas, 12 morreram antes de completar 28 dias devido a complicações de diarreia. Qual a Taxa de Mortalidade Neonatal (TMN) do rebanho?",
        "options": ["TMN de 1,2% | Índice considerado excelente e dentro dos padrões internacionais.", "TMN de 10% | Índice alarmante, indicando que a propriedade está perdendo o dobro do limite técnico aceitável (< 5%).", "TMN de 20% | Falha crítica total do sistema de dejetos e pastejo.", "TMN de 5% | Dentro da meta estipulada para a pecuária leiteira tropical."],
        "correct": 1, "hint": "Realize o cálculo: (Número de Mortes / Total de Nascidos Vivos) vezes 100. Compare o resultado com a meta de 5%.",
        "explanation": "Cálculo: (12 / 120) * 100 = 10%. O limite máximo recomendado para bezerras de leite é de 5%. Uma taxa de 10% dobra o limite aceitável, apontando para graves gargalos na colostragem, no manejo sanitário do bezerreiro ou na exposição a patógenos ambientais.",
        "funFact": "A taxa de mortalidade neonatal é um dos principais componentes do Índice de Eficiência Zootécnica de propriedades modernas."
    },
    {
        "id": 70202, "station": 7, "species": "Ovinos", "audience": "estudante", "difficulty": 2, "type": "calculo", "tags": ["taxa_de_desmame", "produtividade", "indicador"],
        "question": "Um rebanho ovino iniciou a estação de parição com 200 ovelhas confirmadas prenhas. Ao final do ciclo, foram desmamados com sucesso 240 cordeiros sadios. Qual a taxa de desmame aparente desse rebanho e como se justifica esse número estatisticamente?",
        "options": ["Taxa de 120% | Justifica-se pela alta ocorrência de partos duplos (gêmeos) e triplos, característica de eficiência reprodutiva em ovinos.", "Taxa de 80% | Indica que 40 ovelhas abortaram ou perderam suas crias antes da desmama.", "Taxa de 24% | Erro crítico na coleta de dados zootécnicos do lote.", "A taxa de desmame nunca pode ultrapassar 100%, indicando fraude no inventário da fazenda."],
        "correct": 0, "hint": "Divida o número de cordeiros desmamados pelo total de matrizes prenhas (240/200) e multiplique por 100. Lembre-se de que ovelhas comumente parem mais de um filhote.",
        "explanation": "Cálculo: 240/200 x 100 = 120%. Diferente dos bovinos, que são tipicamente monofetais (um filhote por parto), a ovinocultura de corte busca a prolificidade. Taxas de desmame superiores a 100% demonstram que a parição de gêmeos compensou as perdas naturais de mortalidade neonatal, indicando excelente manejo nutricional e sanitário.",
        "funFact": "Em raças ovinas altamente prolíficas (como Romanov ou Finnish Landrace), a taxa de desmame em plantéis de elite pode ultrapassar impressionantes 200%!"
    },
    {
        "id": 70301, "station": 7, "species": "all", "audience": "veterinario", "difficulty": 3, "type": "calculo", "tags": ["roi", "custo_beneficio", "planejamento"],
        "question": "Um rebanho de 500 matrizes ovinas possui TMN histórica de 18% por hipotermia. Você propõe melhorias estruturais de R$ 5.000,00 para reduzir a TMN para 6%. Considerando o cordeiro desmamado a R$ 300,00, qual o retorno financeiro?",
        "options": ["Impacto econômico nulo ou negativo no curto prazo, inviabilizando o projeto de investimento.", "Ganho bruto de R$ 18.000,00 e ROI de 260% (lucro líquido de R$ 13.000,00 sobre o custo da intervenção).", "Ganho bruto de R$ 36.000,00 e ROI de 500% em cenários epidemiológicos controlados.", "Aumento exclusivo de bem-estar animal sem impacto quantificável no fluxo de caixa da propriedade."],
        "correct": 1, "hint": "Primeiro calcule quantos cordeiros a menos morrerão: 500 x (0,18 - 0,06). Depois multiplique pelo valor do cordeiro e calcule o ROI líquido sobre o custo.",
        "explanation": "Redução da mortalidade: 18% - 6% = 12% de economia de vidas. Em 500 partos, isso representa 500 x 0,12 = 60 cordeiros salvos. Valor gerado: 60 x R$ 300,00 = R$ 18.000,00. Retorno Líquido: R$ 18.000,00 - R$ 5.000,00 = R$ 13.000,00. ROI = (13000 / 5000) x 100 = 260%. Demonstração clara de viabilidade econômica do manejo veterinário.",
        "funFact": "Mostrar gráficos de ROI e impacto financeiro direto é a ferramenta mais poderosa que um Médico Veterinário consultor possui para convencer produtores tradicionais a adotarem novas tecnologias."
    },
    {
        "id": 70302, "station": 7, "species": "all", "audience": "veterinario", "difficulty": 3, "type": "interpretacao", "tags": ["curva_de_mortalidade", "epidemiologia", "auditoria"],
        "question": "Ao auditar os registros zootécnicos de um grande complexo de recria de bezerras, você observa que 75% das mortes concentram-se entre o 3º e o 10º dia de vida, com diagnóstico clínico de desidratação por diarreia. Onde está o gargalo operacional primário da propriedade baseado nessa distribuição cronológica?",
        "options": ["Falha grave na higienização do galpão de desmama de transição precoce (animais acima de 60 dias).", "Manejo inadequado de colostragem (tempo, volume ou qualidade) nas primeiras horas de vida, associado à contaminação microbiana imediata no piquete de parto.", "Deficiência crônica de proteína na dieta de transição pós-desmama.", "Subdosagem sistemática de vacinas contra raiva e febre aftosa aplicadas na cobrição."],
        "correct": 1, "hint": "Mortalidade hiperaguda na primeira semana de vida por patógenos entéricos está intimamente ligada à ausência de anticorpos circulantes (FTIP) e alta carga infecciosa ambiental pós-nascimento.",
        "explanation": "A cronologia da mortalidade neonatal é o melhor indicador epidemiológico de campo. Mortes por diarreia na primeira semana de vida indicam que os animais contraíram patógenos (como E. coli K99 ou Rotavírus) logo ao nascer e não possuíam imunidade colostral sistêmica para conter a replicação. Exige auditoria imediata no banco de colostro, no tempo de fornecimento e na higiene do piquete-maternidade.",
        "funFact": "Se o pico de mortalidade ocorresse mais tarde, entre a 3ª e a 5ª semana de vida, o foco da investigação mudaria para a higiene do bezerreiro (baia individual/coletiva) e infecções por Eimeria spp. ou Salmonella spp."
    }
];

/* ==========================================================================
   BANCO EXPANDIDO — 42 QUESTÕES NOVAS (Auditoria v2)
   2 por estação × 7 estações × 3 níveis = 42 questões inéditas
   ========================================================================== */
const NOVAS_QUESTOES = [
    { "id": 10105, "station": 1, "species": "all", "audience": "leigo", "difficulty": 1, "type": "conceitual", "tags": ["parto", "sinais", "manejo"],
      "question": "🐄🐑 Quais são os sinais mais claros de que uma vaca ou ovelha está prestes a parir nas próximas horas?",
      "options": ["O animal come mais do que o habitual, fica agitado e vocaliza constantemente no meio do rebanho.", "O úbere fica cheio e inchado, a vulva fica rosada e relaxada, a garupa 'afunda' e a fêmea se isola do restante do bando buscando um canto quieto.", "Os olhos ficam vermelhos, o animal começa a coxear e a temperatura cai para menos de 35°C.", "A fêmea começa a recusar água e a esfregar o focinho no chão repetidamente durante horas."],
      "correct": 1, "hint": "A natureza prepara o corpo da mãe para o parto de forma visível. Observe o úbere, a garupa e o comportamento social dela nas horas que antecedem o nascimento.",
      "explanation": "Entre 12 e 24 horas antes do parto, o ligamento sacro-isquiático relaxa (a 'garupa afunda'), a vulva fica edemaciada e avermelhada, o úbere enche com colostro espesso e a fêmea busca se isolar. Reconhecer esses sinais permite ao produtor estar presente, oferecer assistência imediata ao filhote assim que nasce e reduzir drasticamente a mortalidade neonatal nas primeiras horas de vida.",
      "funFact": "Muitos produtores experientes fazem o 'teste do colostro antes do parto': se ao pressionar o teto sair líquido aguado e claro, o parto ainda está longe; se sair um líquido espesso e amarelado (colostro), o nascimento é questão de horas!" },

    { "id": 10106, "station": 1, "species": "all", "audience": "leigo", "difficulty": 2, "type": "prevencao", "tags": ["distócia", "emergencia", "parto"],
      "question": "Quanto tempo, no máximo, uma fêmea pode ficar em trabalho de parto ativo — com esforço visível e contrações fortes — antes de o produtor chamar ajuda veterinária de emergência?",
      "options": ["Não há limite de tempo. A natureza sempre resolve sozinha, independentemente de quanto demore o processo.", "Se o filhote não nascer dentro de 2 a 4 horas do início do esforço ativo, é necessário chamar o veterinário imediatamente.", "O prazo seguro é de 24 horas de esforço máximo. Somente depois disso se busca ajuda profissional.", "Só se chama o veterinário quando o filhote já está morto ou a mãe não consegue mais se levantar."],
      "correct": 1, "hint": "Contrações fortes e prolongadas sem resultado são uma emergência. O filhote pode morrer por falta de oxigênio e a mãe pode sofrer lesões internas irreversíveis.",
      "explanation": "Em partos normais, a expulsão do filhote após o início das contrações expulsivas deve ocorrer em até 2 horas em bovinos e 1 hora em ovinos. Além desse tempo sem progresso, configura-se Distócia (parto difícil), que exige manobra obstétrica veterinária. Tentativas amadoras de puxar o filhote sem técnica adequada podem lacerar o canal do parto da mãe e matar a cria por trauma.",
      "funFact": "Entre as principais causas de distócia em bovinos está o desalinhamento do filhote dentro do útero. Em casos de 'cabeça virada para o flanco', o veterinário precisa girar e reposicionar o filhote manualmente dentro do útero antes de puxá-lo com segurança!" },

    { "id": 10204, "station": 1, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["periodo_transicao", "far_off", "close_up", "nutricao"],
      "question": "Na nutrição de vacas no período de transição, qual a diferença estratégica entre as fases 'far-off' e 'close-up' e o principal objetivo de cada uma?",
      "options": ["Não há distinção. Vacas no período seco devem receber a mesma dieta do dia da secagem até o parto para evitar oscilações metabólicas.", "Far-off (21 a 60 dias antes do parto): dieta de mantença controlando ECC entre 3,0 e 3,25; Close-up (últimas 3 semanas): maior densidade energética e proteica para adaptar a microbiota ruminal ao concentrado pós-parto e reduzir o BEN inicial.", "Far-off: alta energia para engordar o feto ao máximo; Close-up: restrição total de cálcio e fósforo para prevenção de hipocalcemia.", "A fase far-off exige sais aniônicos em alta dose; a fase close-up, apenas volumosos de alta lignina sem concentrado."],
      "correct": 1, "hint": "São duas fases com objetivos completamente distintos: na primeira, preservamos o ECC ideal; na segunda, preparamos o rúmen e o metabolismo para suportar a alta demanda da lactação que virá.",
      "explanation": "Na fase far-off, evita-se ganho excessivo de ECC (risco de lipomobilização e cetose pós-parto). Na fase close-up, aumenta-se progressivamente a energia e proteína metabolizável para adaptar a microbiota ruminal ao concentrado, elevar a capacidade de consumo de MS no pós-parto e reduzir o descompasso entre pico de produção e pico de ingestão, minimizando o Balanço Energético Negativo (BEN) inicial.",
      "funFact": "Vacas sem fase close-up adequada têm maior prevalência de cetose, deslocamento de abomaso à esquerda e retenção de placenta no pós-parto imediato — todos problemas caros que poderiam ser prevenidos com nutrição de transição correta." },

    { "id": 10205, "station": 1, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "interpretacao", "tags": ["cetose", "bhb", "monitoramento", "pre_parto"],
      "question": "Qual o método de campo mais prático para monitorar risco de cetose subclínica em vacas na fase close-up e qual o valor de corte que indica risco aumentado?",
      "options": ["Coleta de urina para mensurar pH urinário. Valores abaixo de 6,0 indicam cetose estabelecida.", "Dosagem de Beta-Hidroxibutirato (BHB) sérico via aparelho portátil (como o Precision Xtra ou FreeStyle Optium). Valores acima de 0,6 mmol/L no pré-parto indicam lipomobilização precoce e risco aumentado de cetose clínica no pós-parto.", "Avaliação visual do escore de fezes: fezes pastosas indicam fermentação excessiva e cetose em andamento.", "Pesagem semanal das vacas comparada a curva padrão de perda de condição pós-parto esperada."],
      "correct": 1, "hint": "Existe um aparelho de glicosímetro adaptado, barato e portátil, que mede o principal corpo cetônico no sangue a campo com uma gota de sangue da veia da cauda.",
      "explanation": "O BHB (beta-hidroxibutirato) é o principal metabólito da lipólise hepática durante o BEN. Valores acima de 0,6 mmol/L no pré-parto indicam mobilização precoce de gordura, com alta probabilidade de cetose clínica ou subclínica nas primeiras 2 a 3 semanas de lactação. O monitoramento permite intervenção nutricional proativa (propilenoglicol, niacina) antes que o problema se instale e comprometa produção e fertilidade.",
      "funFact": "A cetose subclínica no pré-parto aumenta em até 3 vezes o risco de retenção de placenta, metrite e deslocamento de abomaso nas semanas seguintes ao parto. Um exame barato de campo pode evitar um tratamento caro logo depois!" },

    { "id": 10303, "station": 1, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["dcad", "sais_anionicos", "pH_urinario", "hipocalcemia"],
      "question": "Ao implementar dietas aniônicas (DCAD negativo) para prevenção de hipocalcemia periparto, qual o método de monitoramento a campo que confirma eficácia do protocolo e qual a meta de pH urinário para raças europeias?",
      "options": ["Dosagem semanal de PTH sérico e calcitonina, comparados a vacas controle não suplementadas com sais aniônicos.", "Mensuração diária do pH urinário em amostra coletada 4 a 6 horas após a refeição: pH entre 6,0 e 6,8 confirma acidose metabólica compensada adequada para sensibilizar receptores de PTH.", "Avaliação quinzenal do ECC e comparação com curva padrão de perda de condição pós-parto esperada para a raça.", "Coleta de líquido ruminal via sonda orogástrica com meta de pH ruminal entre 5,8 e 6,2 como indicativo de acidose sistêmica."],
      "correct": 1, "hint": "O rim é o grande regulador do equilíbrio ácido-base. Quando há acidose metabólica controlada, o animal elimina cátions em excesso pela urina, acidificando-a de forma mensurável com uma fita reagente de farmácia.",
      "explanation": "A mensuração do pH urinário é o padrão de campo para confirmar eficácia do DCAD negativo. pH entre 6,0–6,8 confirma acidose metabólica compensada suficiente para sensibilizar os receptores de PTH nos ossos e rins. pH acima de 7,5 indica protocolo não funcionando (palatabilidade do sal ou formulação incorreta). pH abaixo de 5,5 indica acidose excessiva, com risco de anorexia e imunossupressão.",
      "funFact": "Para vacas zebuínas (Bos indicus), as metas de pH urinário são ligeiramente mais altas (6,2–7,0) em razão de sua maior eficiência de absorção de cálcio intestinal em comparação às raças europeias como a Holandesa e a Jersey." },

    { "id": 10304, "station": 1, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["distócia", "obstetrica", "manobra", "cesarea"],
      "question": "CASO CLÍNICO: Vaca multípara com 285 dias de gestação está em trabalho de parto há 3 horas sem progressão. No exame de toque, você identifica apresentação anterior, posição dorsal, postura com desvio lateral da cabeça (cabeça desviada para o flanco direito). Qual a manobra obstétrica inicial e a janela de tempo para tentativa antes de indicar cesariana?",
      "options": ["Aplicar 20 UI de ocitocina IV imediatamente e aguardar mais 2 horas antes de qualquer manobra manual.", "Realizar retropulsão do feto com lubrificação abundante (carboximetilcelulose), corrigir o desvio cefálico com laço ou gancho cefálico posicionando a cabeça sobre os membros antes de tentar extração. Indicar cesariana se não houver progressão em 15 a 20 minutos de manipulação ativa.", "Realizar tração máxima imediata sobre os membros anteriores com correntes obstétricas sem correção prévia da postura, pois a força de tração corrige a posição da cabeça automaticamente.", "Indicar cesariana imediata sem tentativa de correção manual, pois qualquer manobra em desvio lateral de cabeça é contraindicada para a espécie bovina."],
      "correct": 1, "hint": "Em distócias por deflexão lateral de cabeça, a correção da postura cefálica é obrigatória antes de qualquer tração. A cabeça precisa estar apoiada sobre os membros para que o diâmetro do conjunto caiba no canal pélvico.",
      "explanation": "O desvio lateral de cabeça é uma das distócias fetais mais comuns em bovinos. Sem corrigir a postura cefálica, a tração aumenta o diâmetro do conjunto cabeça+membros, provocando lacerações no canal do parto e trauma fetal severo. A retropulsão reduz a pressão do canal e cria espaço para a manobra. Após 15 a 20 minutos sem progressão, a cesariana oferece melhor prognóstico fetal e materno.",
      "funFact": "O desvio lateral de cabeça é mais comum em novilhas de primeira cria com bezerros de raças de grande porte. O acompanhamento frequente das fêmeas no piquete-maternidade (a cada 30 minutos nas horas finais) reduz dramaticamente a mortalidade perinatal por distócia." },

    { "id": 20104, "station": 2, "species": "all", "audience": "leigo", "difficulty": 2, "type": "prevencao", "tags": ["qualidade_colostro", "manejo", "mae"],
      "question": "🍼 Quais situações podem fazer com que a mãe produza um colostro fraco, com pouca proteção para o filhote?",
      "options": ["Mãe de primeira cria (novilha), vaca muito gorda que parou de comer antes do parto, ou mãe que começou a perder leite pelo teto antes de o filhote nascer.", "A qualidade do colostro é sempre a mesma, independentemente do estado de saúde, da raça ou do manejo nutricional da mãe.", "Apenas animais de raças importadas produzem colostro fraco. Raças nacionais sempre produzem colostro de excelente qualidade.", "Mães que bebem muita água no final da gestação produzem colostro mais diluído e consequentemente mais fraco em anticorpos."],
      "correct": 0, "hint": "O colostro é fabricado pelo corpo da mãe. Tudo que afeta a saúde, a alimentação ou a experiência dela influencia diretamente a qualidade desse leite especial.",
      "explanation": "Novilhas no primeiro parto geralmente produzem colostro com menos anticorpos do que vacas adultas, pois ainda foram expostas a menos doenças ao longo da vida. Vacas muito gordas tendem a reduzir o consumo de alimentos antes do parto, comprometendo a produção. E se a mãe começar a perder leite antes de parir (colostragem precoce), parte dos anticorpos vai embora antes do filhote nascer. Por isso fazendas bem manejadas guardam colostro das vacas mais velhas e saudáveis como reserva estratégica.",
      "funFact": "Existe um aparelho chamado refratômetro de Brix que avalia a qualidade do colostro em segundos com apenas 2 gotas: se marcar 22% ou mais, o colostro é excelente; abaixo disso, deve ser trocado pelo banco de colostro!" },

    { "id": 20105, "station": 2, "species": "Bovinos", "audience": "leigo", "difficulty": 2, "type": "aplicacao", "tags": ["sonda_esofagica", "mamadeira", "bezerro_fraco"],
      "question": "Se um bezerro recém-nascido está muito fraco para ficar em pé e mamar sozinho na mãe, qual a forma correta de garantir que ele receba o colostro a tempo?",
      "options": ["Esperar até que ele ganhe força suficiente para mamar sozinho, mesmo que demore 12 a 24 horas.", "Ordenhar o colostro da mãe e oferecer com mamadeira ou, se necessário, com uma sonda esofágica (introduzida no esôfago até o estômago), garantindo a chegada segura do líquido sem risco de engasgo.", "Forçar o filhote debaixo da mãe em posição horizontal para tentar fazê-lo sugar mesmo sem conseguir engolir.", "Dar leite normal de outra vaca que já está há mais de 60 dias em lactação, pois o colostro não é obrigatório se o filhote estiver fraco."],
      "correct": 1, "hint": "O tempo é o maior inimigo do filhote fraco. Ele não pode esperar, mas também não pode se engasgar. A sonda esofágica resolve os dois problemas ao mesmo tempo.",
      "explanation": "Filhotes fracos correm alto risco de aspiração pulmonar ao tentar mamar sem força. A mamadeira permite controlar a velocidade da mamada. A sonda esofágica é uma ferramenta segura que conduz o colostro diretamente ao estômago sem risco de engasgo — especialmente indicada nos primeiros 60 minutos de vida quando o animal está em decúbito. A habilidade de usar uma sonda esofágica é um dos treinamentos mais importantes para qualquer trabalhador de fazenda com maternidade.",
      "funFact": "Um bezerro Holandês recém-nascido de 40 kg precisa receber pelo menos 4 litros de colostro nas primeiras 2 horas de vida — o equivalente a 4 garrafas de 1 litro — para garantir proteção adequada!" },

    { "id": 20204, "station": 2, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "imunologia", "tags": ["igg1", "igg2", "imunidade_passiva", "colostro"],
      "question": "No sistema imunológico bovino, qual a principal diferença funcional entre as subclasses IgG1 e IgG2 presentes no colostro?",
      "options": ["IgG1 é produzida exclusivamente no baço fetal durante a gestação, enquanto a IgG2 é transferida somente pelo leite de transição após o 3º dia pós-parto.", "A IgG1 (predominante no colostro bovino, ~75% das imunoglobulinas) é ativamente transportada do soro sanguíneo materno para o colostro via receptor FcRn, conferindo imunidade sistêmica ao neonato; a IgG2 predomina no soro adulto, sendo menos eficientemente transferida para a glândula mamária.", "Não há distinção funcional entre IgG1 e IgG2 em ruminantes; ambas atuam exclusivamente na mucosa intestinal sem absorção sistêmica.", "A IgG2 é a subclasse absolutamente predominante no colostro bovino (>90%) e a única responsável pela proteção sistêmica do neonato."],
      "correct": 1, "hint": "Observe qual subclasse é ativamente 'recrutada' para o colostro pela glândula mamária bovina e qual fica predominantemente no soro materno.",
      "explanation": "Em bovinos, a IgG1 é a subclasse predominante no colostro (75–80% das imunoglobulinas), pois é ativamente transportada do soro materno para o úbere via receptor FcRn (Neonatal Fc Receptor). Após absorção intestinal pelo bezerro na janela neonatal, promove imunidade humoral sistêmica. A IgG2 predomina no soro bovino adulto mas é menos eficientemente transportada para o colostro. A IgA e IgM colostrais oferecem proteção local no trato gastrointestinal do neonato.",
      "funFact": "O receptor FcRn que transporta a IgG1 ao colostro é o mesmo receptor que, no intestino do neonato, realiza a absorção reversa das imunoglobulinas para a corrente sanguínea nas primeiras horas de vida. O mesmo 'porteiro' dos dois lados da parede!" },

    { "id": 20205, "station": 2, "species": "Bovinos", "audience": "estudante", "difficulty": 3, "type": "prevencao", "tags": ["pasteurizacao", "johne", "mycobacterium", "biosseguridade"],
      "question": "Por que a pasteurização do colostro bovino a 60°C por 60 minutos (método LTLT) é considerada uma medida estratégica de biosseguridade em rebanhos leiteiros de alto padrão sanitário?",
      "options": ["Porque elimina as gorduras saturadas do colostro, reduzindo o risco de hiperlipidemia em bezerros de alto ganho de peso.", "Porque inativa o Mycobacterium avium subsp. paratuberculosis (agente da Doença de Johne), Salmonella spp. e Mycoplasma bovis, sem destruir significativamente as imunoglobulinas presentes no colostro.", "Porque esteriliza completamente o colostro, eliminando 100% de todos os vírus, bactérias e parasitas existentes na secreção.", "Porque reduz o teor de lactose do colostro, prevenindo a diarreia osmótica em bezerros sensíveis à lactose."],
      "correct": 1, "hint": "O Mycobacterium paratuberculosis é o principal alvo: causa enterite progressiva incurável em bovinos adultos e pode ser transmitido verticalmente pelo colostro de vacas portadoras subclínicas.",
      "explanation": "A Paratuberculose (Doença de Johne) é causada pelo M. avium subsp. paratuberculosis, que pode ser transmitido pelo colostro de vacas portadoras assintomáticas. A pasteurização LTLT (60°C/60 min) inativa esse microrganismo sem comprometer significativamente a qualidade imunológica do colostro — estudos mostram perda inferior a 15% nas concentrações de IgG. Diferente da pasteurização do leite (72°C/15s), temperaturas mais altas desnaturariam as proteínas colostrais.",
      "funFact": "Um estudo no Journal of Dairy Science demonstrou que bezerros alimentados com colostro pasteurizado a 60°C apresentaram níveis séricos de IgG equivalentes aos alimentados com colostro cru de mesma qualidade, mas com redução de 70% na contaminação bacteriana!" },

    { "id": 20303, "station": 2, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "calculo", "tags": ["plasma_oral", "ftip", "imunidade_passiva", "alternativa_colostro"],
      "question": "Em uma fazenda sem banco de colostro e com bezerro de menos de 6 horas de vida, o plasma bovino por via oral pode ser utilizado como alternativa emergencial. Qual concentração mínima de IgG no plasma e qual volume por kg/PV são necessários para oferecer transferência passiva aceitável?",
      "options": ["Plasma com IgG > 1.000 mg/dL; volume de 1 mL/kg via oral como dose única nas primeiras 12 horas.", "Plasma com IgG entre 2.000 e 5.000 mg/dL; 1 a 2 mL/kg por via intraperitoneal é suficiente após fechamento intestinal (> 24h).", "Plasma com IgG igual ou maior que 2.000 mg/dL (idealmente igual ou maior que 3.000 mg/dL); 20 a 40 mL/kg por via oral antes das 6 horas de vida, aproveitando a janela de absorção macromolecular intestinal.", "Plasma de qualquer origem com IgG mensurável; dose padronizada de 100 mL total via subcutânea para qualquer peso corporal."],
      "correct": 2, "hint": "Para que a imunidade passiva funcione via oral, o neonato precisa estar dentro da janela de absorção de macromoléculas e o plasma precisa ter concentração de IgG suficientemente alta para compensar a eficiência menor de absorção comparada ao colostro.",
      "explanation": "A via oral é eficaz apenas nas primeiras 6–12h de vida, enquanto a pinocitose nos enterócitos está ativa. O plasma deve ter IgG igual ou maior que 2.000–3.000 mg/dL (confirmado por eletroforese ou imunodifusão radial). O volume de 20–40 mL/kg compensa a menor eficiência de absorção do plasma em relação ao colostro nativo. Após o fechamento intestinal (> 24h), apenas as vias intraperitoneal ou intravenosa oferecem imunidade humoral sistêmica eficaz.",
      "funFact": "O plasma hiperimune de vacas vacinadas com bacterinas específicas (E. coli K99, Salmonella, Rotavírus) contém concentrações de anticorpos específicos muito maiores que o plasma de doadores não vacinados — ideal para uso emergencial em bezerreiros com surto ativo de diarreia neonatal!" },

    { "id": 20304, "station": 2, "species": "all", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["ftip", "auditoria", "pst", "protocolo_colostragem"],
      "question": "CASO CLÍNICO: Em uma auditoria de bezerreiro com 35 animais entre 3 e 7 dias de vida, a mensuração de PST via refratômetro clínico revela que 11 animais (31,4%) apresentam PST abaixo de 5,0 g/dL. Qual o protocolo de intervenção imediata e quais indicadores de processo você revisaria para identificar a causa-raiz da falha?",
      "options": ["Administrar 2 g de amoxicilina oral/dia por 5 dias aos animais com falha e manter o protocolo atual de colostragem sem alterações.", "Para os animais com FTIP confirmada (PST abaixo de 5,0 g/dL): administrar plasma IV ou IP (20–40 mL/kg); Revisão obrigatória dos 5 pilares do protocolo: (1) timing do fornecimento abaixo de 2h, (2) volume igual ou maior que 10% do PV, (3) qualidade Brix igual ou maior que 22%, (4) método de fornecimento (sonda quando necessário), (5) higiene dos equipamentos e práticas de ordenha.", "Substituir o colostro materno por substituto comercial por via oral em todos os animais sem triagem prévia de PST e retestar o lote em 30 dias.", "Realizar transfusão de sangue total de vacas doadoras na dose de 10 mL/kg em todos os animais do lote, independentemente do PST individual de cada um."],
      "correct": 1, "hint": "A FTIP já instalada requer plasma para correção imediata. Mas o mais importante é identificar onde o protocolo falhou para impedir que os próximos filhotes repitam o mesmo desfecho.",
      "explanation": "Prevalência de FTIP superior a 10% é inaceitável e exige investigação imediata. Os 5 pilares a revisar: (1) tempo de fornecimento (abaixo de 2h do nascimento), (2) volume adequado (igual ou maior que 10% do PV na 1ª mamada), (3) qualidade do colostro (Brix igual ou maior que 22%), (4) método de oferta (sonda quando bezerro fraco), (5) higiene para evitar contaminação bacteriana. Para os animais já com FTIP (acima de 24h de vida), a via oral não funciona: plasma IP ou IV é a única forma de fornecer imunidade humoral sistêmica eficaz.",
      "funFact": "Propriedades leiteiras de alta performance nos EUA e Europa adotam a meta de menos de 5% de bezerros com PST abaixo de 5,0 g/dL e realizam auditorias mensais de PST como indicador obrigatório de qualidade do bezerreiro — tão importante quanto a produção de leite!" },

    { "id": 30104, "station": 3, "species": "all", "audience": "leigo", "difficulty": 1, "type": "conceitual", "tags": ["temperatura_normal", "termometro", "monitoramento"],
      "question": "❄️ Qual é a temperatura corporal normal de um bezerro ou cordeiro saudável e como o produtor pode verificar isso na fazenda?",
      "options": ["Temperatura normal entre 38,5°C e 40,0°C. Mede-se com termômetro clínico (igual ao humano) introduzido no reto do animal por pelo menos 1 minuto.", "A temperatura normal dos filhotes é a mesma dos humanos (36°C a 37°C) e só pode ser medida em laboratório com equipamentos especiais.", "Não existe temperatura padrão para filhotes. O produtor deve avaliar apenas pelo toque na orelha e na pata do animal.", "A temperatura normal de bezerros é de 42°C a 43°C. Qualquer valor abaixo disso indica problema grave que exige ação imediata."],
      "correct": 0, "hint": "A temperatura de ruminantes é um pouco mais alta que a humana. Um termômetro retal simples é a ferramenta mais confiável e barata para checar se o filhote está bem.",
      "explanation": "A temperatura retal normal de bovinos e ovinos varia entre 38,5°C e 40,0°C. Abaixo de 38,0°C já indica hipotermia e exige atenção imediata. Qualquer termômetro digital de ponta pode ser usado: basta introduzir suavemente o bulbo no reto do animal por pelo menos 1 minuto. É um equipamento simples e essencial em fazendas com parições no inverno.",
      "funFact": "As orelhas e os membros do filhote ficam sempre mais frios que o corpo central nas hipotermias. Por isso, orelhas geladas num recém-nascido são um sinal de alerta fácil de perceber mesmo sem termômetro — e exigem ação imediata!" },

    { "id": 30105, "station": 3, "species": "all", "audience": "leigo", "difficulty": 2, "type": "prevencao", "tags": ["abrigo", "capa", "lampada_infravermelha", "prevencao_frio"],
      "question": "Quais atitudes práticas do produtor ajudam diretamente a prevenir a hipotermia em bezerros e cordeiros nascidos em noites muito frias?",
      "options": ["Deixar o filhote ao relento durante a noite para que ele se adapte naturalmente ao frio do ambiente da região.", "Usar capas ou roupinhas específicas para filhotes, forrar o chão da baia com cama seca e limpa (palha ou serragem) e instalar lâmpadas infravermelhas de aquecimento nos abrigos de parição.", "Molhar o filhote com água fria assim que nasce para estimular a respiração pelo choque térmico.", "Amarrar o filhote próximo à mãe para impedir que ele se movimente e gaste energia tentando se aquecer."],
      "correct": 1, "hint": "Evitar a perda de calor é tão importante quanto aquecer. Três coisas protegem o filhote: cama seca como isolante térmico, proteção contra o vento com a capa, e uma fonte de calor externo.",
      "explanation": "Capas de neoprene ou algodão para filhotes reduzem a perda de calor em até 50% em noites frias. A cama seca (palha ou serragem) funciona como isolante térmico entre o corpo do filhote e o chão gelado. As lâmpadas infravermelhas elevam a temperatura do abrigo sem risco de queimadura. Juntas, essas medidas simples e de baixo custo evitam a maior parte das mortes neonatais por hipotermia.",
      "funFact": "As capinhas para bezerros foram criadas nos EUA e Europa para evitar mortes por hipotermia em raças como a Holandesa, que tem pouca gordura subcutânea ao nascer. Hoje são usadas no Brasil inteiro durante o inverno e já salvam milhares de animais por temporada!" },

    { "id": 30204, "station": 3, "species": "all", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["classificacao_hipotermia", "protocolo_clinico", "hipotermia"],
      "question": "Como se classifica clinicamente a hipotermia neonatal em ovinos e bovinos e quais as condutas correspondentes a cada grau de severidade?",
      "options": ["Hipotermia é classificada apenas em 'presente ou ausente'; a conduta única é aquecimento por banho-maria a 42°C, independentemente da temperatura retal medida.", "Leve (38,0–38,4°C): secagem e aquecimento ambiental passivo; Moderada (36,0–37,9°C): aquecimento externo ativo mais colostro morno por via oral; Severa (abaixo de 36°C com ausência de reflexo de sucção): glicose IP ou IV aquecida mais aquecimento gradual externo, com via oral contraindicada pelo risco de broncoaspiração.", "Hipotermia Grau I (abaixo de 36°C): transfusão de plasma quente IV imediata; Hipotermia Grau II (36–38°C): dexametasona IM isolada e aquecimento passivo ao sol.", "A classificação da hipotermia é feita exclusivamente pelo nível de glicemia sérica, sem correlação com a temperatura retal do animal."],
      "correct": 1, "hint": "O reflexo de sucção é o divisor de águas no protocolo clínico: se está ausente, a via oral é PROIBIDA pelo risco de aspiração pulmonar. A temperatura retal guia o grau e determina a via de tratamento.",
      "explanation": "A classificação prática em campo: Leve (38,0–38,4°C) — animal treme, em pé ou quase, reflexo de sucção preservado; Moderada (36–37,9°C) — caído mas responsivo, reflexo de sucção fraco mas presente; Severa (abaixo de 36°C) — decúbito lateral, sem reflexo de sucção, bradicardia, hipoglicemia instalada. Na hipotermia severa, administrar glicose IP ou IV aquecida ANTES do reaquecimento externo é mandatório para evitar coma hipoglicêmico durante o aumento da demanda metabólica pelo reaquecimento.",
      "funFact": "O aquecimento muito rápido em hipotermia severa pode causar o fenômeno de 'afterdrop': vasos periféricos dilatam repentinamente e sangue frio retorna ao coração, podendo desencadear fibrilação ventricular. O reaquecimento gradual (máximo 1 grau Celsius por hora) salva vidas!" },

    { "id": 30205, "station": 3, "species": "all", "audience": "estudante", "difficulty": 2, "type": "interpretacao", "tags": ["hipoglicemia", "termogenese", "gordura_marrom", "hipotermia"],
      "question": "Por qual razão a hipoglicemia é uma consequência quase inevitável da hipotermia severa e prolongada em neonatos ruminantes?",
      "options": ["Porque o frio inibe diretamente a produção de insulina pelo pâncreas, causando hiperglicemia que progressivamente consome o glicogênio hepático.", "Porque os estoques de glicogênio hepático (muito limitados em neonatos) e o Tecido Adiposo Marrom são esgotados na tentativa de manter a temperatura corporal pela termogênese, consumindo toda a reserva energética disponível.", "Porque a hipotermia causa vasoconstrição severa no trato gastrointestinal, bloqueando a absorção de glicose do leite materno por até 72 horas após o nascimento.", "Porque o frio intenso provoca hemólise das hemácias, que passam a consumir glicose sanguínea como combustível energético alternativo."],
      "correct": 1, "hint": "Pense em um animal tentando desesperadamente gerar calor. Quanto combustível ele consome? De onde vem esse combustível num neonato que talvez nem tenha mamado ainda?",
      "explanation": "Os neonatos de ruminantes possuem reservas de glicogênio hepático e Tecido Adiposo Marrom (TAM) extremamente limitadas, suficientes para no máximo 24–48h de termogênese máxima. Na hipotermia severa, o organismo mobiliza essas reservas aceleradamente via tremores musculares (glicogênio) e termogênese química (TAM). Se o filhote não recebeu colostro ou está hipotérmico há mais de 6–8h, as reservas se esgotam e a glicemia cai abaixo de 40 mg/dL, comprometendo o SNC.",
      "funFact": "Nos primeiros 30 minutos de vida, um cordeiro em ambiente muito frio (0°C) pode consumir até 50% dos seus estoques de Tecido Adiposo Marrom apenas tentando se aquecer. Uma hora sem colostro num dia gelado pode ser fatal!" },

    { "id": 30303, "station": 3, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["afterdrop", "reaquecimento_gradual", "hipotermia", "fluidoterapia"],
      "question": "CASO CLÍNICO: Após administração de glicose IP aquecida em um bezerro com hipotermia severa (temperatura retal 34,2°C), você inicia o reaquecimento externo. Qual a taxa de reaquecimento adequada e qual fenômeno fisiopatológico justifica a contraindicação do reaquecimento rápido?",
      "options": ["Reaquecimento deve ser o mais rápido possível (3°C por hora ou mais) para reduzir o tempo de isquemia cerebral. O único risco documentado é hipercalemia de reperfusão.", "Reaquecimento gradual de 0,5 a 1,0°C/hora. O fenômeno de 'afterdrop' (queda paradoxal da temperatura central após início do aquecimento periférico) ocorre pela vasodilatação cutânea que redistribui sangue frio periférico ao coração, podendo causar fibrilação ventricular fatal.", "Reaquecimento em banho-maria a 45°C por 30 minutos seguido de exposição direta ao sol. O único risco relevante é queimadura superficial da pele do neonato.", "Taxa de reaquecimento padronizada de 2°C/hora em todos os casos; o principal risco é hipernatremia por perda de fluidos pela pele durante o aquecimento externo."],
      "correct": 1, "hint": "Imagine o que acontece quando os vasos da pele se dilatam de repente e o sangue que estava estagnado e frio nas extremidades retorna ao coração central de uma única vez.",
      "explanation": "O fenômeno de 'afterdrop' é um risco real na hipotermia severa: ao aquecer perifericamente de forma rápida, os vasos cutâneos vasodilatam e o sangue frio acumulado nas extremidades retorna ao coração. Essa queda súbita na temperatura cardíaca pode desencadear arritmias ventriculares fatais. Por isso, o reaquecimento deve ser central (fluidos IV/IP aquecidos mais ar quente suave) e gradual (0,5–1°C/hora), com monitoramento cardíaco.",
      "funFact": "O fenômeno de 'afterdrop' foi descrito pela primeira vez em mergulhadores hipotérmicos salvos em mares árticos: muitos morriam de fibrilação ventricular justamente ao serem aquecidos rapidamente. O protocolo foi adaptado para medicina veterinária neonatal décadas depois." },

    { "id": 30304, "station": 3, "species": "Ovinos", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["glicose", "intraperitoneal", "cordeiro", "emergencia"],
      "question": "A administração de glicose a 20% por via intraperitoneal (IP) é técnica essencial em cordeiros com hipotermia severa. Qual o ponto anatômico correto, dose e temperatura da solução, e por que essa via é preferida à venosa nesses casos?",
      "options": ["Aplicar no flanco esquerdo na fossa paralombar; dose de 5 mL/kg de glicose 50% em temperatura ambiente; a via IP é preferida por ser mais rápida do que a IV.", "Aplicar a 1,5–2 cm lateral ao umbigo, direcionando a agulha a 45° em direção ao quadril; dose de 10 mL/kg de glicose 20% aquecida a 38–39°C. A via IP é preferida por ser tecnicamente acessível a produtores treinados, dispensar acesso venoso, e ter absorção peritoneal suficientemente rápida para reverter hipoglicemia crítica em campo.", "Aplicar diretamente na veia safena lateral com agulha 22G; dose de 3 mL/kg de glicose 50% em temperatura ambiente; a IP é usada apenas quando o acesso venoso é impossível.", "Aplicar na fontanela craniana do cordeiro; dose de 1 mL/kg de glicose 10%; técnica desenvolvida exclusivamente para cordeiros prematuros de menos de 30 dias."],
      "correct": 1, "hint": "O ponto anatômico correto fica logo ao lado do umbigo, e a solução precisa estar morna (próxima à temperatura corporal) para não agravar a hipotermia central do animal durante a infusão.",
      "explanation": "O ponto de aplicação IP em cordeiros é 1,5–2 cm lateral ao umbigo (lado direito), com agulha 18–20G direcionada a 45° para o quadril. Dose: 10 mL/kg de glicose a 20% aquecida a 38–39°C. Soluções frias agravam a hipotermia e causam peritonite. Soluções acima de 20% causam irritação peritoneal e peritonite química. A via IP tem absorção rápida pelos vasos linfáticos peritoneais e pode ser realizada por técnicos e produtores treinados a campo.",
      "funFact": "Essa técnica simples de glicose IP é responsável por salvar dezenas de milhares de cordeiros anualmente no Reino Unido, onde é ensinada como rotina obrigatória em todos os cursos de ovinocultura prática!" },

    { "id": 40102, "station": 4, "species": "all", "audience": "leigo", "difficulty": 1, "type": "prevencao", "tags": ["higiene_baia", "pressao_infecciosa", "limpeza", "umbigo"],
      "question": "🦠 Por que é tão importante trocar e limpar a cama (palha, serragem) da baia onde os filhotes ficam logo após o nascimento?",
      "options": ["Apenas por questões estéticas e de apresentação da propriedade. A sujeira acumulada no chão não afeta a saúde dos filhotes.", "Porque fezes velhas acumuladas na cama funcionam como um 'hotel para bactérias'. Filhotes sem defesas que deitam ou andam nessa sujeira ficam expostos a bilhões de germes que causam diarreia, infecção de umbigo e pneumonia.", "Porque a palha velha produz gases que fazem os filhotes espirrar, o que é desconfortável mas sem risco à saúde.", "Porque os filhotes jovens comem a cama do chão e podem entupir o estômago com material indigestível."],
      "correct": 1, "hint": "Um filhote nasce sem defesas no sangue. O ambiente limpo é a primeira linha de proteção enquanto o colostro ainda não foi absorvido pelo intestino.",
      "explanation": "A cama suja acumula fezes ricas em bactérias perigosas como E. coli, Salmonella e Clostridium. Um filhote que nasce nesse ambiente absorve essas bactérias pela boca, pelo umbigo aberto e até pela pele. Como não tem anticorpos próprios ainda, basta uma pequena quantidade dessas bactérias para causar diarreia fulminante, septicemia e morte em 24 a 48 horas. Trocar a cama antes e depois de cada parto é uma das ações mais baratas e mais eficientes de redução de mortalidade neonatal.",
      "funFact": "Especialistas calculam que a 'pressão de infecção' em uma baia com cama de 4 meses pode ser até 1.000 vezes maior do que em uma baia com cama trocada recentemente. Isso é o que os técnicos chamam do 'princípio do baldinho cheio'!" },

    { "id": 40103, "station": 4, "species": "all", "audience": "leigo", "difficulty": 2, "type": "aplicacao", "tags": ["artrite_septica", "junta_boba", "umbigo", "iodo"],
      "question": "Um produtor percebe que um bezerro de 2 semanas começou a coxear de uma pata, com a junta do joelho inchada, quente e o animal com febre. O que isso pode indicar e qual a relação com o umbigo?",
      "options": ["O bezerro apenas se machucou ao correr no pasto. Não tem relação com o umbigo e resolve sozinho em 3 dias com repouso.", "A infecção do umbigo não tratada adequadamente logo após o nascimento pode se espalhar pelo sangue e se instalar nas articulações, causando artrite séptica (infecção dentro da junta). Exige atendimento veterinário urgente.", "Juntas inchadas em filhotes são sempre causadas por deficiência de vitamina D e falta de sol. Deve-se aplicar vitamina D injetável imediatamente.", "O animal ingeriu planta venenosa que causa inchaço nas articulações. Não tem nenhuma relação com o nascimento ou o umbigo."],
      "correct": 1, "hint": "O umbigo é uma 'janela aberta' que vai diretamente para a circulação sanguínea. Bactérias que entram por um umbigo mal desinfetado podem viajar pelo sangue para qualquer órgão do corpo.",
      "explanation": "A artrite séptica neonatal (popularmente conhecida como 'junta boba' ou 'mal do caruara') é uma das consequências mais graves da onfalite negligenciada. A bactéria entra pelo cordão umbilical mal desinfetado, ganha a circulação e se instala nas articulações. A infecção dentro da articulação causa dor intensa, febre e, se não tratada com antibióticos e drenagem, destrói permanentemente a cartilagem.",
      "funFact": "Um umbigo que não foi mergulhado no iodo logo após o nascimento pode estar infectado por dentro mesmo parecendo seco por fora. Por isso a IMERSÃO (e não apenas pincelar) é tão crítica: o líquido precisa entrar dentro do canal umbilical!" },

    { "id": 40203, "station": 4, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "interpretacao", "tags": ["diarreia", "etiologia", "ecoli", "faixa_etaria"],
      "question": "O diagnóstico diferencial etiológico das diarreias neonatais é fortemente guiado pela faixa etária de ocorrência. Qual agente é considerado a principal causa de diarreia em bezerros entre 1 e 4 dias de vida?",
      "options": ["Eimeria bovis (Coccidiose bovina), com pico de ocorrência entre 3 e 4 semanas de vida.", "Escherichia coli enterotoxigênica (ETEC, fímbria K99/F5), que coloniza e produz toxinas termoestáveis no intestino delgado de bezerros nas primeiras 72 a 96 horas de vida.", "Rotavírus bovino tipo A, predominante clinicamente entre 7 e 14 dias de vida.", "Cryptosporidium parvum, com pico de ocorrência característico entre 5 e 15 dias de vida."],
      "correct": 1, "hint": "Há correlação temporal direta entre a capacidade de adesão do agente aos receptores específicos do enterócito imaturo e a faixa etária de maior suscetibilidade do neonato.",
      "explanation": "A E. coli enterotoxigênica (ETEC K99+) possui fímbrias F5 que aderem especificamente a receptores do enterócito imaturo do neonato, predominando clinicamente nas primeiras 96h de vida. À medida que o intestino amadurece, esses receptores se modificam e a ETEC perde a capacidade de colonização eficiente. Rotavírus/Coronavírus surgem entre 5 e 14 dias; Cryptosporidium entre 5 e 15 dias; Salmonella e Eimeria em períodos mais tardios.",
      "funFact": "A vacina comercial contra E. coli K99 aplicada nas mães no pré-parto garante alta concentração de anticorpos específicos anti-K99 no colostro, sendo a principal estratégia de prevenção contra a diarreia neonatal que mata bezerros nos primeiros 3 dias de vida!" },

    { "id": 40204, "station": 4, "species": "Bovinos", "audience": "estudante", "difficulty": 3, "type": "caso_clinico", "tags": ["clostridiose", "clostridium_perfringens", "enterite_hemorragica"],
      "question": "Qual a manifestação clínica e o mecanismo fisiopatológico da enterotoxemia por Clostridium perfringens tipo C em bezerros neonatos?",
      "options": ["Diarreia crônica com má absorção progressiva de proteínas por destruição gradual das microvilosidades jejunais ao longo de 2 a 3 semanas.", "Enterite hemorrágica aguda, frequentemente fulminante (morte sem sinais premonitórios), causada pelas toxinas alfa e beta que destroem o epitélio intestinal, provocando necrose hemorrágica do delgado.", "Timpanismo ruminal com alcalose metabólica por fermentação excessiva da lactose do colostro por bactérias anaeróbias no rúmen imaturo.", "Artrite poliarticular migratória seguida de meningoencefalite progressiva, com mortalidade de 30% ao longo de 5 a 7 dias."],
      "correct": 1, "hint": "As toxinas do C. perfringens tipo C são extremamente potentes e de ação ultrarrápida sobre o epitélio intestinal. Em neonatos, a morte pode ocorrer antes mesmo de o produtor perceber qualquer sinal clínico.",
      "explanation": "O C. perfringens tipo C produz principalmente as toxinas alfa e beta. A toxina beta é altamente necrotizante e destrói o epitélio intestinal, causando enterite hemorrágica com necrose das alças. Em neonatos, a doença progride tão rapidamente que muitas vezes o único sinal clínico observado é a morte súbita. A prevenção por vacinação das mães com bacterina polivalente no pré-parto é a única estratégia verdadeiramente eficaz.",
      "funFact": "Diferente do C. perfringens tipo D (que afeta cordeiros maiores com dieta rica em concentrado), o tipo C ataca preferencialmente neonatos nas primeiras 48 a 72 horas de vida, independentemente da dieta. É a causa de morte súbita mais devastadora e imprevisível em bezerreiros sem vacinação adequada!" },

    { "id": 40303, "station": 4, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["contaminacao_colostro", "higiene", "ftip", "bacterias"],
      "question": "Bezerros alimentados com colostro altamente contaminado por bactérias (acima de 100.000 UFC/mL) apresentam comprometimento da absorção de IgG mesmo quando o colostro tem excelente qualidade imunológica. Qual a principal razão fisiológica para esse fenômeno?",
      "options": ["As bactérias produzem enzimas proteolíticas que degradam as imunoglobulinas no lúmen intestinal antes de qualquer absorção pelo enterócito.", "A endotoxina bacteriana (LPS) ativa receptores TLR4 dos enterócitos, acelerando o fechamento das junções celulares e reduzindo prematuramente a janela de absorção macromolecular por pinocitose.", "As bactérias competem diretamente com os receptores FcRn dos enterócitos pela ligação às imunoglobulinas, bloqueando fisicamente o transporte transcelular.", "Não há relação documentada entre contaminação bacteriana do colostro e absorção de IgG. A qualidade imunológica mensurada pelo Brix é o único fator relevante."],
      "correct": 1, "hint": "Pense em como a endotoxina bacteriana (LPS) afeta a sinalização intracelular dos enterócitos do neonato. Existe um mecanismo imunológico de 'alarme' que pode fechar prematuramente a janela de absorção.",
      "explanation": "A endotoxina (LPS) de bactérias Gram-negativas ativa os receptores TLR4 dos enterócitos do neonato, desencadeando sinalização inflamatória local que acelera o 'closure' intestinal. Colostros com mais de 100.000 UFC/mL resultam em menores níveis séricos de IgG nos bezerros mesmo com ótima qualidade pelo Brix. O protocolo padrão de higiene: (1) lavagem com detergente alcalino quente (acima de 45°C), (2) enxágue com água quente, (3) imersão em solução desinfetante (iodóforo 25 ppm ou peróxido de hidrogênio ativado), (4) enxágue final.",
      "funFact": "Colostros com mais de 1.000.000 UFC/mL (comuns em mamadeiras mal lavadas) podem reduzir a absorção de IgG em até 40%, transformando um colostro de excelente qualidade (Brix igual ou maior que 22%) em proteção insuficiente para o neonato!" },

    { "id": 40304, "station": 4, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["artrite_septica", "antibioticoterapia", "prognostico", "lavagem_articular"],
      "question": "CASO CLÍNICO: Bezerro de 18 dias com artrite séptica em articulação fêmoro-tíbio-patelar esquerda: distensão capsular severa, temperatura articular elevada, dor intensa e febre de 40,5°C. Punção articular revela líquido sinovial turvo com leucócitos acima de 30.000 células/µL e proteína acima de 3 g/dL. Qual a conduta terapêutica e o prognóstico?",
      "options": ["Antibioticoterapia sistêmica oral por 5 dias com amoxicilina e AINE tópico; prognóstico excelente em 100% dos casos tratados precocemente.", "Lavagem articular (artrocentese e irrigação com SF 0,9% aquecido mais antibiótico) mais antibioticoterapia sistêmica parenteral por 14 a 21 dias (ceftiofur ou ampicilina mais gentamicina) mais AINE sistêmico (flunixin meglumine); prognóstico reservado a grave pela alta probabilidade de sequelas articulares permanentes.", "Corticoterapia de alta potência (dexametasona 0,5 mg/kg/dia por 10 dias) como tratamento exclusivo: a inflamação é o problema principal e deve ser suprimida imediatamente.", "Amputação preventiva do membro afetado antes de confirmar o agente etiológico, pelo alto risco de septicemia sistêmica progressiva."],
      "correct": 1, "hint": "A infecção dentro de uma articulação destrói a cartilagem pela ação direta das bactérias E das enzimas inflamatórias. Apenas antibiótico sistêmico não alcança concentrações adequadas no líquido sinovial sem a lavagem articular associada.",
      "explanation": "A artrite séptica neonatal exige abordagem agressiva: a lavagem articular remove bactérias, fibrina e enzimas proteolíticas que destroem a cartilagem articular. A antibioticoterapia sistêmica deve ser de amplo espectro, em altas doses e por longa duração (14–21 dias). O AINE reduz a inflamação e a dor. O prognóstico é reservado pois articulações com processo séptico estabelecido frequentemente evoluem para fibrose, anquilose ou osteomielite.",
      "funFact": "A concentração de antibióticos no líquido sinovial é geralmente apenas 25 a 50% da concentração sérica, o que explica por que doses usuais frequentemente falham no tratamento da artrite séptica neonatal sem a lavagem articular associada!" },

    { "id": 50103, "station": 5, "species": "Bovinos", "audience": "leigo", "difficulty": 2, "type": "conceitual", "tags": ["cetose", "ben", "alimentacao", "reconhecimento"],
      "question": "🌿 Como o produtor percebe que o emagrecimento de uma vaca nas primeiras semanas após o parto está passando dos limites e se tornando perigoso?",
      "options": ["Quando a vaca aumenta o consumo de ração e bebe muito mais água que o normal. Esses sinais indicam metabolismo acelerado e saudável.", "Quando a vaca emagrece visivelmente com costelas salientes, apresenta um odor adocicado no hálito (cheiro de acetona ou maçã verde), fica apática e para de comer. Isso indica que o corpo está queimando gordura em excesso, situação chamada de cetose.", "Quando a vaca produz mais leite que o normal nas primeiras 2 semanas. A hiperprodução indica metabolismo em ótimo funcionamento.", "Quando as fezes ficam muito firmes e secas. Isso indica que o animal está aproveitando toda a energia da ração de forma eficiente."],
      "correct": 1, "hint": "O corpo da vaca que não tem energia suficiente começa a queimar sua própria gordura. Essa queima produz substâncias com cheiro característico que até os humanos conseguem sentir no hálito do animal.",
      "explanation": "Quando a vaca gasta mais energia produzindo leite do que consegue ingerir, ela entra em Balanço Energético Negativo (BEN) severo. O corpo queima gordura corporal acumulada de forma acelerada, produzindo corpos cetônicos (como a acetona). O cheiro adocicado no hálito é o sinal clássico de cetose. Se não corrigida com suplementos energéticos (propilenoglicol), a vaca para de comer, cai e pode morrer.",
      "funFact": "Algumas vacas com cetose subclínica (sem sinais visíveis) têm o leite com sabor e odor de acetona. Se esse leite for misturado ao tanque da fazenda, pode ser percebido pelos consumidores e reprovado pelo laticínio na análise de qualidade!" },

    { "id": 50104, "station": 5, "species": "Bovinos", "audience": "leigo", "difficulty": 1, "type": "conceitual", "tags": ["hipocalcemia", "calcio", "febre_leite", "lactacao"],
      "question": "🐄 Por que vacas que produzem muito leite podem cair, tremer e ficar paralisadas logo depois do parto, mesmo estando em clima quente e sem infecção?",
      "options": ["Porque o esforço de produzir muito leite aumenta a temperatura do úbere, causando uma febre localizada que paralisa os músculos.", "Porque a produção intensa de leite retira cálcio do sangue da vaca mais rápido do que o corpo consegue repor. Com cálcio baixo no sangue, os músculos e nervos param de funcionar, causando tremores, fraqueza e queda.", "Porque o leite produzido em grandes quantidades azeda dentro do úbere, gerando toxinas que causam paralisia muscular progressiva.", "Porque vacas que produzem muito leite sempre desenvolvem infecção bacteriana no sangue. Os tremores são sintomas dessa infecção."],
      "correct": 1, "hint": "O cálcio não serve apenas para ossos. Ele é fundamental para que os músculos se contraiam. Sem ele no sangue na quantidade certa, nem o coração funciona adequadamente.",
      "explanation": "O leite é riquíssimo em cálcio. No início da lactação, quando a vaca começa a produzir muito leite rapidamente, o cálcio sai do sangue para o úbere muito mais depressa do que o corpo consegue repor da alimentação ou dos ossos. Com cálcio baixo no sangue (hipocalcemia), os músculos perdem a capacidade de se contrair de forma normal, causando fraqueza progressiva, tremores, incapacidade de se levantar e, se não tratada a tempo, parada cardíaca.",
      "funFact": "A 'Febre do Leite' não causa febre de verdade! Na verdade, a vaca afetada geralmente está com a temperatura corporal abaixo do normal, porque sem cálcio o coração bate mais fraco e os músculos não geram calor suficiente para manter a temperatura!" },

    { "id": 50203, "station": 5, "species": "Bovinos", "audience": "estudante", "difficulty": 3, "type": "interpretacao", "tags": ["cetose_tipo1", "cetose_tipo2", "ben", "lipidose_hepatica"],
      "question": "Qual a principal diferença fisiopatológica entre a Cetose Tipo I (cetose de subnutrição) e a Cetose Tipo II (cetose da vaca gorda) em bovinos leiteiros?",
      "options": ["A cetose tipo I ocorre exclusivamente em primíparas magras no pré-parto; a cetose tipo II afeta apenas vacas pluríparas com baixo ECC no pós-parto tardio.", "A cetose tipo I resulta de BEN por insuficiência de ingestão energética em vacas com ECC normal ou baixo, sem lipidose hepática severa; a cetose tipo II origina-se da lipomobilização massiva de tecido adiposo pré-existente em vacas com ECC acima de 3,75 ao parto, com lipidose hepática intensa que compromete a gliconeogênese.", "A cetose tipo I responde exclusivamente ao propilenoglicol VO; a cetose tipo II é indiferente a qualquer precursor glicogênico e exige insulinoterapia intravenosa como tratamento exclusivo.", "Não há distinção clínica ou terapêutica entre cetose tipo I e tipo II; ambas são tratadas de forma idêntica com glicose IV em dose única de 500 mL."],
      "correct": 1, "hint": "O estado corporal da vaca antes do parto é determinante. Uma vaca magra e uma vaca gorda ao parir terão mecanismos completamente distintos para desenvolver cetose.",
      "explanation": "Na Cetose Tipo I, o animal tem ECC adequado e desenvolve BEN por incapacidade de ingerir alimento suficiente para cobrir a alta demanda energética da lactação. A lipólise é moderada e o fígado mantém capacidade de gliconeogênese. Responde bem a precursores glicogênicos (propilenoglicol, glicose IV, niacina). Na Cetose Tipo II (vaca gorda), a lipomobilização massiva pré-parto satura o fígado de ácidos graxos não-esterificados (AGNEs), causando lipidose hepática severa que compromete a gliconeogênese. Tem pior prognóstico e responde menos ao tratamento convencional.",
      "funFact": "Vacas com Cetose Tipo II frequentemente desenvolvem deslocamento de abomaso à esquerda no pós-parto imediato, pois a atonia gastrointestinal causada pela cetose e pela hipocalcemia predispõe mecanicamente ao deslocamento do órgão para o espaço criado pelo útero esvaziado!" },

    { "id": 50204, "station": 5, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["bhb", "cetose_subclinica", "monitoramento", "rebanho"],
      "question": "Em um programa de monitoramento de cetose subclínica em rebanho leiteiro, qual a meta de prevalência (BHB igual ou maior que 1,2 mmol/L) considerada aceitável internacionalmente na 1ª e 2ª semana pós-parto?",
      "options": ["Prevalência de até 50% das vacas na 1ª semana é considerada fisiologicamente normal em raças de alta produção como a Holstein.", "Prevalência abaixo de 15% na 1ª semana e abaixo de 10% na 2ª semana pós-parto são as metas de rebanho consideradas excelentes internacionalmente.", "O valor de corte para relevância clínica é BHB igual ou maior que 2,5 mmol/L; o monitoramento abaixo desse limiar não possui impacto produtivo ou reprodutivo documentado.", "A cetose subclínica não impacta métricas produtivas como produção de leite, taxa de concepção ou saúde uterina, sendo monitorada apenas por interesse acadêmico."],
      "correct": 1, "hint": "A cetose subclínica tem custos econômicos documentados mesmo sem sinais clínicos visíveis. O monitoramento precoce permite intervenção nutricional antes que os problemas se manifestem clinicamente.",
      "explanation": "Vacas com BHB igual ou maior que 1,2 mmol/L na 1ª e 2ª semana pós-parto apresentam redução de 5 a 15% na produção de leite na lactação, menor taxa de prenhez (até 20% a menos), maior risco de metrite, mastite e deslocamento de abomaso. A meta internacional aceita é prevalência igual ou menor que 15% na 1ª semana e igual ou menor que 10% na 2ª semana. Prevalências acima de 25% indicam falha grave no manejo nutricional do período de transição.",
      "funFact": "Cada vaca com cetose subclínica gera perda econômica estimada entre US$ 100 e US$ 400 por lactação. Em rebanhos de 200 vacas com 30% de prevalência, isso representa US$ 6.000 a 12.000 em perdas invisíveis por ano — sem nenhum animal sequer cair ou apresentar sinais clínicos!" },

    { "id": 50302, "station": 5, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["dae", "ben", "atonia", "hipocalcemia"],
      "question": "Qual a cadeia fisiopatológica que conecta o Balanço Energético Negativo (BEN) pós-parto ao Deslocamento de Abomaso à Esquerda (DAE) e quais fatores de risco nutricionais pré-parto amplificam essa cadeia?",
      "options": ["O BEN eleva o pH ruminal, que retroalimenta a motilidade abomasal via reflexo enterorruminal, causando dilatação e deslocamento mecânico lateral esquerdo.", "O BEN induz hipocalcemia subclínica e hipercetonemia, causando atonia da musculatura lisa gastrointestinal. O abomaso hipomotor acumula gás e flutua dorsalmente para o espaço entre o rúmen e a parede abdominal esquerda (espaço criado pelo útero esvaziado). Fatores de risco pré-parto: alto ECC ao parto (acima de 3,75), baixo FDN efetivo na dieta de transição e DCAD excessivamente positivo.", "O deslocamento é causado exclusivamente pelo aumento do volume uterino na gestação gemelar, que empurra mecanicamente o abomaso para a posição lateral esquerda.", "O BEN causa hiperglicemia compensatória que estimula hiperprodução de ácido clorídrico no abomaso, o qual cria bolsas de gás que deslocam o órgão mecanicamente."],
      "correct": 1, "hint": "Dois eventos simultâneos: um abomaso que não se move (atonia por hipocalcemia e cetonemia) e um espaço que se abre (útero esvaziado). O abomaso com gás precisa ir para algum lugar.",
      "explanation": "A sequência fisiopatológica: BEN → lipomobilização → hipocalcemia subclínica mais hipercetonemia → atonia abomasal (via inibição do tônus vagal e da musculatura lisa gastrointestinal) → acúmulo de gás no abomaso hipomotor. Simultaneamente, o útero esvaziado pós-parto cria espaço no abdômen esquerdo. O abomaso gasoso flutua para esse espaço, encravando-se entre o rúmen e a parede lateral esquerda (DAE). Os fatores de risco pré-parto amplificadores: ECC acima de 3,75 ao parto, baixo FDN efetivo, DCAD muito positivo e transição abrupta para concentrado.",
      "funFact": "A omentopexia (correção cirúrgica do DAE com fixação do abomaso à parede abdominal) é a cirurgia de campo mais realizada em rebanhos leiteiros de alta produção no mundo. Um veterinário experiente realiza o procedimento em menos de 40 minutos com o animal em pé sob anestesia local!" },

    { "id": 50303, "station": 5, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["propilenoglicol", "cetose", "gliconeogenese", "toxicidade"],
      "question": "O propileno glicol (PG) é amplamente utilizado como precursor glicogênico oral em vacas com cetose. Qual o mecanismo de ação hepático, qual a dose terapêutica recomendada e qual o risco real da superdosagem?",
      "options": ["O PG é convertido diretamente em IgG no fígado, elevando o sistema imune e a produção de anticorpos. Dose: 500 mL/dia VO. Superdosagem causa apenas diarreia osmótica passageira.", "O PG é absorvido pelo rúmen e convertido no fígado em piruvato e lactato, que entram no ciclo de Krebs como precursores glicogênicos, elevando a glicemia e reduzindo a lipólise. Dose terapêutica: 300 a 500 mL/dia VO (divididos em 2 administrações). Superdosagem (acima de 600 mL/dia) pode causar depressão do SNC, ataxia e acidemia propionato.", "O PG é fermentado pelas bactérias ruminais em ácido propiônico, que compete com o BHB pelos transportadores hepáticos. Dose única de 1 litro é recomendada e não há risco de toxicidade documentado em bovinos.", "O PG age como quelante de corpos cetônicos no sangue, eliminando-os pela urina. A dose de 50 mL/kg é segura e padronizada para todas as raças e categorias de bovinos."],
      "correct": 1, "hint": "O PG não é diretamente glicose. É um precursor: o fígado converte o PG em moléculas que entram na rota da gliconeogênese. Como qualquer substância, em excesso tem efeito tóxico mensurável.",
      "explanation": "O propileno glicol (1,2-propanodiol) é absorvido no rúmen e no intestino delgado, convertido no fígado em D-lactato e piruvato, com posterior gliconeogênese. Isso eleva a glicemia e reduz a mobilização de AGNEs via elevação da insulina. A dose padrão de 300–500 mL/dia VO em 2 administrações diárias é eficaz e segura. Doses superiores a 600 mL/dia elevam o propionato sérico e podem causar acidemia, ataxia e depressão do SNC, especialmente em vacas já comprometidas metabolicamente.",
      "funFact": "O propileno glicol foi originalmente desenvolvido como antifúngico na indústria alimentícia. Sua ação gliconeogênica em bovinos foi descoberta nos anos 1960 e hoje é um dos compostos mais vendidos no mundo para uso em pecuária leiteira — um uso completamente diferente do propósito original!" },

    { "id": 60103, "station": 6, "species": "all", "audience": "leigo", "difficulty": 1, "type": "prevencao", "tags": ["cadeia_frio", "vacina", "armazenamento"],
      "question": "💉 Por que é tão importante guardar as vacinas na geladeira, em temperatura entre 2°C e 8°C, e nunca deixar congelar?",
      "options": ["Para que as vacinas mantenham aparência bonita e não percam a cor original. A temperatura não afeta a eficácia do produto.", "Porque as vacinas são feitas de partes de vírus, bactérias ou proteínas delicadas que são destruídas pelo calor excessivo e pelos cristais de gelo do congelamento. Uma vacina mal armazenada parece normal, mas não protege o animal de nada.", "Por ser exigência da vigilância sanitária apenas para fins de rastreabilidade, sem impacto real na eficácia imunológica do produto.", "Porque vacinas aquecidas causam reações alérgicas graves nos animais. O frio evita essas reações e reduz a dor no local de aplicação."],
      "correct": 1, "hint": "A vacina só funciona porque apresenta ao sistema imune do animal uma versão enfraquecida ou fragmentada do patógeno. Se esse material for destruído pelo calor ou congelamento, não há o que 'ensinar' ao sistema imune.",
      "explanation": "A 'cadeia de frio' vacinal não é burocracia: é a garantia de que os antígenos (fragmentos de vírus, bactérias ou toxinas purificadas) chegam íntegros ao animal. Temperatura acima de 8°C desnatura proteínas vacinais e inativa vírus atenuados. Temperatura abaixo de 0°C congela os adjuvantes oleosos, separando a emulsão e tornando a vacina ineficaz. Uma vacina mal armazenada parece idêntica à correta — não tem cheiro diferente, não muda de cor — mas simplesmente não funciona.",
      "funFact": "Estima-se que até 25% das falhas vacinais relatadas a campo no Brasil decorrem de falhas na cadeia de frio durante o transporte ou armazenamento, e não de problemas com a vacina em si. O produtor paga, aplica, mas o animal fica sem proteção!" },

    { "id": 60104, "station": 6, "species": "all", "audience": "leigo", "difficulty": 2, "type": "prevencao", "tags": ["tetano", "umbigo", "vacina", "colostro"],
      "question": "Por que é tão importante vacinar a mãe contra o tétano antes do parto para proteger o filhote recém-nascido?",
      "options": ["Porque a vacina da mãe passa diretamente pelo umbigo do filhote durante o parto, imunizando-o naquele exato momento.", "Porque o filhote recebe os anticorpos contra o tétano pelo colostro da mãe vacinada. Com o umbigo aberto nos primeiros dias, há grande risco de entrada da bactéria Clostridium tetani do solo pelo cordão umbilical.", "O tétano não existe mais no Brasil e em toda a América Latina. A vacinação é apenas um protocolo antigo mantido por tradição, sem necessidade real.", "A vacinação da mãe serve somente para protegê-la durante o estresse do parto. Não tem nenhum efeito protetor sobre o filhote nascido."],
      "correct": 1, "hint": "O umbigo aberto do filhote fica em contato direto com o solo, a cama da baia e as fezes dos outros animais. A bactéria do tétano vive justamente no solo contaminado por fezes.",
      "explanation": "O Clostridium tetani sobrevive em forma de esporo no solo, especialmente em solos adubados com fezes de animais. O umbigo aberto do filhote é a porta de entrada perfeita. Se a mãe foi vacinada no pré-parto, ela produz altos títulos de anticorpos antitetânicos que se concentram no colostro. O filhote que mama nas primeiras horas absorve esses anticorpos e fica protegido nos primeiros meses — justamente o período em que o umbigo ainda está presente e vulnerável a infecções.",
      "funFact": "O tétano neonatal em bovinos e ovinos, chamado popularmente de 'mal do sete' (pois os animais afetados geralmente morrem entre o 5º e o 10º dia de vida), ainda causa mortes em fazendas sem protocolo vacinal adequado no Brasil, especialmente no período chuvoso quando a terra está mais contaminada!" },

    { "id": 60202, "station": 6, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "prevencao", "tags": ["vacina_viva", "gestacao", "bvdv", "animal_pi"],
      "question": "Por que o uso de vacinas vivas modificadas (VVM) em fêmeas bovinas gestantes é uma contraindicação importante em alguns protocolos sanitários?",
      "options": ["Porque VVMs causam reações anafiláticas severas no feto em qualquer fase gestacional, independentemente da cepa utilizada.", "Porque agentes vacinais atenuados de determinadas VVMs (como o BVDV atenuado) podem cruzar a barreira placentária de bovinos e, se aplicados entre os dias 40 e 120 de gestação, causar infecção fetal com produção de animais Persistentemente Infectados (PI).", "VVMs são completamente seguras em qualquer fase da gestação de bovinos e nunca causam abortamentos nem problemas fetais documentados.", "A contraindicação de VVMs em gestantes se deve exclusivamente ao risco de transmissão por via respiratória para outros animais durante o período pós-vacinação."],
      "correct": 1, "hint": "Em vacinas vivas modificadas, o agente está vivo (apenas enfraquecido). Em situações específicas de janela gestacional, esse agente pode cruzar a barreira placentária.",
      "explanation": "As VVMs contra BVDV são o principal exemplo de contraindicação em gestantes. Cepas de BVDV vacinal atenuado têm tropismo pelo tecido fetal bovino e, se aplicadas entre os dias 40–120 de gestação (janela crítica de imunotolerância fetal), podem cruzar a barreira placentária. O sistema imune do feto imaturo não reconhece o vírus como 'estranho' e se torna tolerante a ele, gerando animais Persistentemente Infectados (PI) — que são as principais fontes de manutenção do BVDV no rebanho.",
      "funFact": "Paradoxalmente, a VACINA contra BVDV pode gerar o mesmo problema que tenta prevenir (animais PI) se aplicada no período errado da gestação! O timing correto da vacinação é tão importante quanto a escolha do produto." },

    { "id": 60203, "station": 6, "species": "all", "audience": "estudante", "difficulty": 2, "type": "aplicacao", "tags": ["anticorpos_maternos", "janela_imunologica", "timing_vacinal"],
      "question": "Em bezerros e cordeiros que receberam colostro de boa qualidade, qual a janela de vulnerabilidade imunológica e qual o momento mais adequado para iniciar o protocolo vacinal primário?",
      "options": ["Os anticorpos maternos duram apenas 7 dias. A vacinação primária deve ser iniciada já na 2ª semana de vida para máxima eficácia imunológica.", "Os anticorpos colostrais (IgG) têm meia-vida de aproximadamente 21 dias em bovinos. Entre 2 e 4 meses de vida, os títulos maternos caem a níveis não protetores mas ainda interferentes. A vacinação primária é mais eficaz a partir dos 60 a 90 dias de vida.", "Em animais que receberam colostro de alta qualidade, os anticorpos maternos duram 12 meses. Não há necessidade de vacinação antes de um ano de vida.", "Os anticorpos maternos não interferem na eficácia das vacinas. O calendário vacinal pode iniciar na 1ª semana de vida com total eficácia."],
      "correct": 1, "hint": "Há um período em que os anticorpos maternos estão baixos o suficiente para não proteger mais contra infecções de campo, mas ainda altos o suficiente para neutralizar os antígenos vacinais. Essa é a janela de vulnerabilidade.",
      "explanation": "A meia-vida das IgG colostrais em bovinos é de aproximadamente 20–21 dias. Aos 60–90 dias de vida, a maioria dos bezerros já tem títulos maternos insuficientes para proteção clínica. Porém, títulos residuais ainda podem neutralizar antígenos vacinais, especialmente de vacinas inativadas. A vacinação primária após os 60 dias, com reforço 3–4 semanas depois, garante a formação de memória imunológica endógena sem a interferência dos anticorpos maternos.",
      "funFact": "Em surtos ativos (como febre aftosa), recomenda-se vacinar mesmo animais com anticorpos maternos presentes, pois a resposta imune celular mediada por linfócitos T pode ser parcialmente estimulada mesmo quando a resposta humoral está bloqueada pelos anticorpos maternos!" },

    { "id": 60303, "station": 6, "species": "Bovinos", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["mannheimia", "pneumonia_enzootica", "complexo_respiratorio", "timing_vacinal"],
      "question": "Ao estruturar protocolo de prevenção de pneumonia enzoótica em bezerros de corte desmamados, qual o papel patogênico da Mannheimia haemolytica e qual o timing ideal de vacinação com bacterina-toxoide?",
      "options": ["M. haemolytica é agente primário da pneumonia bovina e deve ser vacinada exclusivamente por via nasal na semana do desmame para induzir imunidade local no trato respiratório superior.", "M. haemolytica é agente oportunista que prolifera e secreta leucotoxina (LktA) após infecção viral primária (IBR, BVDV, PI3, BRSV); a vacinação ideal ocorre 3 a 4 semanas antes de eventos estressores (desmame, reagrupamento, transporte) para permitir soroconversão completa antes da exposição ao risco.", "M. haemolytica causa exclusivamente pleurite adesiva sem envolvimento do parênquima pulmonar; a vacinação é indicada somente para animais que já desenvolveram doença clínica prévia.", "A vacina contra M. haemolytica é contraindicada concomitantemente a vacinas virais (IBR/BVDV) por antagonismo imunológico documentado. Os protocolos devem ser separados por no mínimo 60 dias."],
      "correct": 1, "hint": "Lembre do Complexo Respiratório Bovino (CRB): geralmente vírus primeiro, depois bactérias oportunistas. A M. haemolytica tem uma estratégia específica e devastadora: secreta uma toxina que destrói justamente os leucócitos que defenderiam o pulmão.",
      "explanation": "O Complexo Respiratório Bovino segue a sequência clássica: infecção viral primária (IBR, BVDV, PI3, BRSV) compromete os mecanismos de defesa pulmonar. A M. haemolytica, colonizadora natural das vias aéreas superiores, prolifera e invade o parênquima, secretando leucotoxina (LktA) que lisa neutrófilos e macrófagos alveolares. A vacinação 3–4 semanas antes do desmame permite soroconversão completa antes do estresse, quando a exposição ao risco é máxima.",
      "funFact": "A leucotoxina da M. haemolytica pertence à família das RTX toxinas. Ela literalmente 'fura' a membrana dos leucócitos, causando lise celular e liberando conteúdo granular inflamatório que amplifica a lesão pulmonar — um patógeno que usa as defesas do hospedeiro contra ele mesmo!" },

    { "id": 60304, "station": 6, "species": "Ovinos", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["clostridioses", "bacterina_toxoide", "ovinos", "primovacinacao"],
      "question": "Em rebanho ovino sem histórico de vacinação, você inicia programa com bacterina-toxoide polivalente (7 ou 8 clostrídios). Qual o protocolo correto de primovacinação e reforço em matrizes adultas para garantir colostro com títulos adequados de antitoxinas?",
      "options": ["Dose única 30 dias antes do parto; os anticorpos vacinais são vitalícios em ovinos adultos e uma única dose é suficiente para toda a vida reprodutiva.", "Primovacinação com 2 doses com intervalo de 28 a 30 dias (D0 e D28–30). Reforço anual: dose única 4 a 6 semanas antes do parto esperado, para maximizar a concentração de antitoxinas no colostro coincidindo com o pico de transferência de IgG para a glândula mamária.", "Três doses com intervalo de 14 dias cada; reforço semestral obrigatório independentemente do período reprodutivo, sem relação com a data do parto prevista.", "Vacinação exclusivamente dos cordeiros a partir de 3 semanas de vida; a imunização das matrizes não oferece proteção colostal relevante contra clostridioses em ovinos."],
      "correct": 1, "hint": "Animais nunca vacinados precisam de 2 exposições ao antígeno (primovacinação) para estabelecer memória imunológica duradoura. O reforço pré-parto serve para ativar essa memória no momento em que o colostro está sendo produzido.",
      "explanation": "O protocolo padrão para animais virgens de vacinação exige primovacinação com 2 doses espaçadas 28–30 dias para estabelecer memória imunológica de células B. Nos anos subsequentes, uma dose de reforço 4–6 semanas antes do parto eleva os títulos de IgG antitoxinas justamente quando a glândula mamária está transferindo ativamente imunoglobulinas para o colostro. O resultado é um colostro com altos títulos de antitoxinas contra enterotoxemia (C. perfringens tipos C e D), tétano (C. tetani) e carbúnculo sintomático (C. chauvoei).",
      "funFact": "Estudos demonstram que cordeiros de matrizes vacinadas no pré-parto têm títulos de antitoxinas clostridiais 10 a 20 vezes maiores aos 30 dias de vida do que cordeiros de matrizes não vacinadas — mesmo quando os cordeiros também recebem vacina individualmente!" },

    { "id": 70102, "station": 7, "species": "all", "audience": "leigo", "difficulty": 1, "type": "conceitual", "tags": ["registros", "gestao", "dados", "manejo"],
      "question": "📊 Por que é importante o produtor anotar em um caderno ou aplicativo as datas de parto, tratamentos, vacinas e peso dos filhotes nascidos na fazenda?",
      "options": ["Para cumprir exigências burocráticas do governo. Os registros não têm utilidade prática real no dia a dia da propriedade.", "Porque ter registros permite ao produtor e ao veterinário identificar padrões de problemas (como muitas mortes de filhotes em um mês específico), calcular se a fazenda está lucrativa e tomar decisões corretas de manejo baseadas em fatos — e não em achismo.", "Os registros só importam para fazendas que exportam para o exterior. Para mercado interno brasileiro, são completamente desnecessários.", "Anotar os dados dos animais aumenta a burocracia e atrapalha o trabalho prático dos colaboradores no dia a dia."],
      "correct": 1, "hint": "Um bom médico registra tudo sobre seus pacientes para acompanhar a evolução e tomar melhores decisões. Um bom produtor faz o mesmo com seus animais. Sem dados, não há como melhorar.",
      "explanation": "Registros simples como data do parto, peso do filhote ao nascer, se tomou colostro e quando, quais vacinas recebeu, se adoeceu e qual foi o tratamento — formam um histórico valioso. Com esses dados é possível identificar quais vacas têm filhotes mais fracos, em quais meses ocorrem mais doenças, se o protocolo de colostro está funcionando e calcular indicadores como mortalidade neonatal e ganho de peso. Isso transforma a tomada de decisão de intuitiva em baseada em evidências.",
      "funFact": "Fazendas que usam fichas ou aplicativos de gestão reportam em média 20% a 30% menos perdas de neonatos por ano, simplesmente porque identificam e corrigem problemas antes que se tornem crises devastadoras!" },

    { "id": 70103, "station": 7, "species": "Bovinos", "audience": "leigo", "difficulty": 2, "type": "interpretacao", "tags": ["periodo_servico", "reproducao", "eficiencia", "indicador"],
      "question": "O que é o 'período de serviço' de uma vaca e como ele afeta diretamente o lucro da fazenda de leite?",
      "options": ["É o tempo total que a fêmea passa sendo ordenhada durante a lactação. Quanto mais longo esse período, mais leite ela produz e mais lucrativa ela é.", "É o tempo entre o parto e a nova fecundação da vaca. Quanto maior esse intervalo, menos filhotes nascem por ano e menor é a eficiência da fazenda — pois cada vaca precisa parir aproximadamente uma vez por ano para ser rentável.", "É a quantidade de serviços ou trabalhos que o animal presta na fazenda, incluindo transporte e tração animal.", "É o período obrigatório em que a fêmea descansa sem produzir leite antes do próximo parto, chamado popularmente de período seco."],
      "correct": 1, "hint": "Em gado de leite, queremos que cada vaca produza um filhote por ano. Se ela demorar muito para ficar prenhe novamente após o parto, esse ciclo se alonga e a fazenda perde produção e filhotes.",
      "explanation": "O Período de Serviço (PS) é o intervalo em dias entre o parto e a concepção seguinte. Em fazendas bem manejadas, busca-se um PS de até 90 dias, o que permite um intervalo entre partos de aproximadamente 365 dias (12 meses). PS maior que 90 dias reduz o número de filhotes por vaca ao ano e diminui a produção de leite vitalícia. Nutrição inadequada no pós-parto, com BEN severo, é a principal causa de PS longo.",
      "funFact": "Uma vaca com período de serviço de 150 dias (ao invés de 90 dias) produz em média 300 a 400 litros a menos de leite na lactação seguinte. Em um rebanho de 100 vacas, isso pode representar mais de 30.000 litros de leite perdidos por ano — apenas pela fertilidade atrasada!" },

    { "id": 70203, "station": 7, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "calculo", "tags": ["roi", "custo_beneficio", "gestao", "colostragem"],
      "question": "Um produtor questiona o custo de R$ 8,00 por bezerro para implementar um protocolo completo de colostro (Brix + banco de colostro + sonda esofágica). Com mortalidade atual de 12% e bezerra avaliada em R$ 1.200,00 ao desmame, qual a análise de custo-benefício correta para justificar o investimento?",
      "options": ["Dizer que o custo emocional de perder animais é suficiente para justificar qualquer investimento, sem a necessidade de calcular o retorno financeiro quantitativamente.", "Calcular: 100 nascimentos × 12% mortalidade = 12 bezerras perdidas (R$ 14.400/ano). Reduzindo para 3% = 3 mortes = 9 bezerras salvas × R$ 1.200 = R$ 10.800 gerados. Custo do protocolo: 100 × R$ 8 = R$ 800. ROI líquido = R$ 10.000 (1.250% de retorno sobre o investimento).", "Afirmar que não é possível calcular ROI de investimentos em prevenção veterinária, pois as variáveis são intrínsecamente imprevisíveis e não quantificáveis.", "Recomendar apenas a sonda esofágica (R$ 2/uso) sem mensuração de qualidade do colostro para reduzir o custo total e manter protocolo mínimo aceitável."],
      "correct": 1, "hint": "O argumento mais poderoso com produtores tradicionais é sempre o econômico. Coloque em números o custo do protocolo versus o custo das perdas evitáveis — o resultado favorece invariavelmente a prevenção.",
      "explanation": "Análise de custo-benefício: Perdas atuais = 12 bezerras × R$1.200 = R$14.400/ano. Meta após protocolo (3%) = 3 mortes = R$3.600/ano. Ganho = R$10.800. Custo do protocolo = R$800. Lucro líquido = R$10.000. ROI = (10.000/800) × 100 = 1.250%! Apresentar esse cálculo objetivo transforma o veterinário de 'custo' em 'investimento estratégico' no vocabulário do produtor.",
      "funFact": "Estudos mostram que cada R$ 1,00 investido em programas de colostragem de qualidade retorna em média R$ 8,00 a R$ 12,00 em bezerra salva, produção de leite futura e eficiência reprodutiva. É um dos melhores ROIs em toda a cadeia da pecuária leiteira!" },

    { "id": 70204, "station": 7, "species": "Bovinos", "audience": "estudante", "difficulty": 2, "type": "interpretacao", "tags": ["indicadores_colostragem", "auditoria", "pst", "brix"],
      "question": "Você realiza auditoria de qualidade em um bezerreiro com 80 animais. Quais são os três principais Indicadores de Processo que você mensuraria para avaliar a eficácia do protocolo de colostragem?",
      "options": ["Peso ao nascer por raça, data de nascimento por estação do ano e custo médio de ração por bezerra.", "(1) Prevalência de FTIP por refratometria de PST em bezerras de 2 a 7 dias (meta: abaixo de 15% com PST abaixo de 5,5 g/dL); (2) Percentual de bezerros que receberam colostro nas primeiras 2 horas de vida (meta: acima de 90%); (3) Qualidade do colostro do banco auditada semanalmente por Brix (meta: igual ou maior que 22%).", "Número total de ordenhas diárias das mães, temperatura ambiente no piquete de parição e custo por litro de leite produzido no mês.", "Relação peso/idade das bezerras aos 30 dias de vida; presença de diarreia clínica visível e incidência de pneumonia acima de 60 dias de vida."],
      "correct": 1, "hint": "Bons indicadores de processo medem o que foi FEITO (tempo, qualidade, volume) e não apenas o resultado final. Os três pilares da colostragem têm indicadores correspondentes mensuráveis.",
      "explanation": "Os 3 indicadores de processo avaliam cada elo crítico da cadeia: (1) PST por refratometria é o indicador de resultado — mede se a IgG chegou ao sangue (o produto final real do protocolo); (2) porcentagem de bezerros alimentados nas primeiras 2h é o indicador de timing — o mais crítico para absorção por pinocitose; (3) Qualidade do colostro do banco (Brix igual ou maior que 22%) garante que o colostro fornecido tem concentração adequada de IgG. Juntos, esses 3 indicadores identificam exatamente onde o protocolo está falhando.",
      "funFact": "Fazendas que monitoram esses 3 indicadores mensalmente conseguem manter prevalência de FTIP abaixo de 10% de forma consistente. Fazendas sem monitoramento sistemático raramente ficam abaixo de 25% de FTIP — e frequentemente nem sabem disso!" },

    { "id": 70303, "station": 7, "species": "all", "audience": "veterinario", "difficulty": 3, "type": "caso_clinico", "tags": ["epidemiologia", "surto_diarreia", "auditoria", "causa_raiz"],
      "question": "Você é acionado para investigar surto de diarreia neonatal com mortalidade de 18% em um bezerreiro nos últimos 30 dias. Qual a sequência metodológica correta de investigação epidemiológica para identificar a causa-raiz?",
      "options": ["Colher amostras de fezes de 2 animais sintomáticos, enviar ao laboratório e aguardar o resultado antes de qualquer intervenção no manejo ou protocolo.", "(1) Descrever o padrão epidemiológico (faixa etária, curva epidêmica, taxa de ataque por lote); (2) Levantar indicadores de processo (PST recente, timing e volume de colostro, Brix, higiene de equipamentos); (3) Avaliar o ambiente (carga microbiana, higiene de baias, densidade); (4) Coletar amostras para diagnóstico etiológico (fezes de 6 a 8 animais agudos); (5) Correlacionar achados e implementar intervenções priorizadas.", "Prescrever antibioticoterapia em massa para todos os animais do lote e aumentar a ventilação do galpão como medida emergencial, aguardando melhora clínica espontânea.", "Solicitar ao produtor que venda imediatamente todos os animais afetados e desinfetar o galpão com hipoclorito de sódio a 2% antes de qualquer investigação adicional."],
      "correct": 1, "hint": "Epidemiologia exige método: primeiro descrevemos o problema (quem, quando, onde, com qual intensidade), depois investigamos os determinantes (por quê?) e somente então implementamos soluções baseadas em evidências.",
      "explanation": "A investigação epidemiológica segue a lógica 'descrever — explicar — intervir'. A curva epidêmica indica se é fonte pontual (pico único = problema específico no protocolo num determinado dia) ou propagada (casos crescentes = falha sistêmica). A correlação entre a faixa etária (1–5 dias = ETEC/hipótese FTIP; 5–15 dias = Crypto/Rota; acima de 3 semanas = Eimeria/Salmonella) com os indicadores de processo permite identificar o gargalo sem aguardar resultado laboratorial.",
      "funFact": "Estudos demonstram que surtos de diarreia neonatal com pico na 1ª semana de vida têm em mais de 80% dos casos correlação com prevalência de FTIP acima de 25%, confirmando que a colostragem inadequada é o determinante mais comum de vulnerabilidade — e o melhor ponto de intervenção!" },

    { "id": 70304, "station": 7, "species": "all", "audience": "veterinario", "difficulty": 3, "type": "aplicacao", "tags": ["sop", "protocolo_neonatal", "gestao_qualidade", "reproducibilidade"],
      "question": "Ao implementar um Protocolo Operacional Padrão (POP/SOP) de manejo sanitário neonatal em uma propriedade leiteira, quais os 5 componentes críticos que devem obrigatoriamente constar no documento para garantir reprodutibilidade e eficácia entre colaboradores?",
      "options": ["Nome do veterinário responsável, CRMV, data de criação do protocolo, assinatura do proprietário e lista de medicamentos permitidos pelo MAPA.", "(1) Protocolo de colostragem (timing, volume, método, Brix e monitoramento por PST); (2) Manejo de umbigo (produto, concentração, técnica de imersão e frequência); (3) Identificação e pesagem ao nascer; (4) Critérios objetivos de triagem clínica diária (temperatura, hidratação, apetite, fezes) com limiares de intervenção definidos; (5) Fluxo de tratamento e escalada de atendimento veterinário (quem trata o quê, até qual ponto de complexidade, quando chamar o veterinário).", "Apenas o protocolo vacinal anual e a lista de produtos autorizados pela ANVISA para uso em alimentos de origem animal.", "Planilha de custos mensais do bezerreiro, metas financeiras de mortalidade aceitável e critérios de descarte antecipado de animais não lucrativos."],
      "correct": 1, "hint": "Um bom POP permite que qualquer colaborador treinado execute o protocolo com a mesma qualidade, independentemente de quem esteja de plantão. Os 5 componentes cobrem os pilares de sobrevivência neonatal — não a burocracia.",
      "explanation": "Um SOP eficaz de manejo neonatal deve cobrir os 5 pilares fundamentais: (1) Colostragem (o fator protetor de maior impacto), com critérios objetivos mensuráveis (Brix, PST, tempo abaixo de 2h); (2) Higiene do umbigo (previne onfalite e artrite séptica); (3) Identificação e pesagem (rastreabilidade e monitoramento de crescimento); (4) Triagem clínica diária com critérios objetivos — elimina a variabilidade de avaliação entre colaboradores; (5) Fluxo de tratamento claro (define o que cada colaborador faz e quando o veterinário deve ser acionado, evitando mortes por atraso de decisão).",
      "funFact": "Um estudo conduzido em 50 fazendas leiteiras americanas demonstrou que propriedades com SOP formal de bezerreiro tinham mortalidade 40% menor do que propriedades sem protocolo escrito — mesmo quando comparadas por tamanho do rebanho, raça e localização geográfica!" }
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
