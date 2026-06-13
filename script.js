 /* ===== VIDAS DO CAMPO - PRO - script.js ===== */

/* ───────────────────────────────────────
   ESTADO GLOBAL
─────────────────────────────────────── */
const G = {
    farm: '', species: 'Bovinos', audience: 'leigo',
    money: 0, score: 0, hearts: 5, survival: 100,
    stationIdx: 0, questionIdx: 0, streak: 0,
    currentQ: null, answered: false, hintStep: 0,
    stationHits: 0, stationTags: new Set(),
    stats: {
        hitsByTag: {},
        missesByTag: {},
        hypothermiaSaved: 0,
        colostrumFails: 0
    },
    timerRef: null, globalStartTime: null, globalTotalSeconds: 0,
    muted: false, prevScreen: 'screen-splash',
    mgIodoDone: false, mgColostroDone: false, mgHipoDone: false, mgDietaDone: false
};

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
        "explanation": "O peso ideal (nem gorda, nem magra) garante que a mãe tenha força para parir e não desenvolva problemas metabólicos perigosos após o comportamento do parto, evitando a famosa síndrome da vaca caída.",
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
        "question": "Ao utilizar um refratômetro de Brix para avaliar a quality do colostro bovino na fazenda, qual o valor de corte em porcentagem (%) que indica um colostro de excelente qualidade (superior a 50 mg/mL de IgG)?",
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
        "correct": 1, "hint": "Basta realizar o cálculo simples de porcentagem sobre a massa do animal.",
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
        "explanation": "O colostro não é apenas proteção (anticorpos), ele é altamente energético e rico em gordura. Sem esse combustível, o bezerro esgota suas reservas rapidamente tentando se aquecer, entrando em hipotermia fatal.",
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
        "correct": 1, "hint": "Se você aquecer externamente um animal hipotérmico que está sem reservas de açúcar no sangue, o cérebro dele entrará em colapso por falta de glicose (choque hipoglicêmico).",
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

Object.freeze(CAMPUS_LIVES_QUIZ_DATABASE);

/* ==========================================================================
   MOTOR DE SELEÇÃO AJUSTADO EM TETOS DE 3 QUESTÕES
   ========================================================================== */
function getQuestionsForProfile(stationId, species, audience) {
    let pool = CAMPUS_LIVES_QUIZ_DATABASE.filter(q => q.station === stationId && (q.species === 'all' || q.species === species));
    
    if (pool.length === 0) {
        pool = CAMPUS_LIVES_QUIZ_DATABASE.filter(q => q.station === stationId);
    }
    
    if (pool.length === 0) return []; 

    let exactMatch = pool.filter(q => q.audience === audience);
    let others = pool.filter(q => q.audience !== audience);

    exactMatch.sort(() => Math.random() - 0.5);
    others.sort(() => Math.random() - 0.5);

    let finalSelection = [...exactMatch, ...others].slice(0, 3);

    while (finalSelection.length > 0 && finalSelection.length < 3) {
        let clone = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
        clone.id = clone.id + '_clone_' + Math.random().toString(36).substr(2, 5); 
        finalSelection.push(clone);
    }

    return finalSelection;
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
    if (targetCard) {
        targetCard.classList.add('selected');
    }
    
    setTimeout(() => startGame(), 400);
}

function startGame() {
    G.money = 100; G.score = 0; G.hearts = 5; G.survival = 100;
    G.stationIdx = 0;
    G.mgIodoDone = false; G.mgColostroDone = false; G.mgHipoDone = false; G.mgDietaDone = false;
    
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
    if (G.stationIdx >= STATIONS.length) { showFinal(); return; }
    
    const st = STATIONS[G.stationIdx];
    G.stationHits = 0;
    G.stationTags.clear();

    let consqHTML = '';
    if (st.id === 4 && (G.stats.missesByTag['colostro'] || 0) > 0) {
        G.survival = Math.max(0, G.survival - 15);
        consqHTML = `
            <div style="background:rgba(217,64,64,0.1); border-left:3px solid var(--red); padding:10px; margin-bottom:12px; font-size:0.85rem; color:var(--text); border-radius: 4px;">
                <strong style="color:var(--red); display:block; margin-bottom:4px;">⚠️ Efeito Borboleta:</strong>
                O bezerro não recebeu colostro de qualidade ontem. A imunidade caiu a zero e uma infecção pulmonar oportunista se instalou de madrugada. <strong>(-15% Sobrevivência)</strong>
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
    
    document.getElementById('intro-badge').textContent = `Etapa ${st.id} de 7`;
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
    
    switchScreen('screen-station-intro');
    updateHUD(); 
}

function startQuiz() {
    const stId = STATIONS[G.stationIdx].id;
    stationQuestions = getQuestionsForProfile(stId, G.species, G.audience);
    G.questionIdx = 0;
    renderQuestion();
    switchScreen('screen-quiz');
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
            dot.classList.add('correct'); 
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
}

function useHint() {
    if (G.answered) return;
    const hints = Array.isArray(G.currentQ.hint) ? G.currentQ.hint : [G.currentQ.hint];
    const hintCost = 25;

    if (G.hintStep < hints.length) {
        if (G.money >= hintCost) {
            G.money -= hintCost;
            
            let textToDisplay = hints[G.hintStep];
            if (G.stationIdx >= 3) {
                textToDisplay = `Dica do Mentor: Pense na fisiologia... ${textToDisplay.split('.')[0]}? Qual seria a consequência lógica disso no organismo do animal?`;
            } else {
                textToDisplay = `💡 Consultoria: ${textToDisplay}`;
            }

            document.getElementById('hint-text').textContent = textToDisplay;
            document.getElementById('hint-text').classList.add('show');
            
            const hintDots = document.querySelectorAll('.hint-dot');
            if(hintDots[G.hintStep]) hintDots[G.hintStep].classList.add('used');
            
            G.hintStep++;
            animateHUDElement('hud-money', 'negative');
            updateHUD();
        } else {
            const hintBtn = document.getElementById('btn-hint');
            hintBtn.textContent = "❌ Saldo Insuficiente";
            hintBtn.style.color = "var(--red)";
            setTimeout(() => { 
                hintBtn.textContent = "💡 Pedir Dica (R$ 25)"; 
                hintBtn.style.color = "var(--amber)";
            }, 2000);
        }
    }
}

function selectAnswer(idx, btn) {
    if (G.answered) return;
    G.answered = true;

    const q = G.currentQ;
    const isCorrect = (idx === q.correct);
    
    document.querySelectorAll('.opt-btn').forEach((b, i) => {
        b.disabled = true;
        if (i === q.correct) b.classList.add('correct');
        else if (i === idx) b.classList.add('wrong');
    });

    if (isCorrect) {
        playSound('correct');
        G.score += 100 - (G.hintStep * 10);
        G.money += 50;
        G.stationHits++;
        G.survival = Math.min(100, G.survival + 5);
        q.tags.forEach(t => G.stats.hitsByTag[t] = (G.stats.hitsByTag[t] || 0) + 1);
        animateHUDElement('hud-survival', 'positive');
        animateHUDElement('hud-money', 'positive');
    } else {
        playSound('wrong');
        G.hearts = Math.max(0, G.hearts - 1);
        G.survival = Math.max(0, G.survival - 12);
        q.tags.forEach(t => G.stats.missesByTag[t] = (G.stats.missesByTag[t] || 0) + 1);

        if (q.tags.includes('colostro') || q.tags.includes('imunidade')) {
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
    
    const winText = q.consequence ? q.consequence.win : '❤️ Efeito positivo na sobrevivência. (+5%)';
    const loseText = q.consequence ? q.consequence.lose : '⚠️ Prejuízo à saúde do rebanho. (-12%)';

    consq.className = 'feedback-consequence ' + (isCorrect ? 'win' : 'lose');
    consq.textContent = isCorrect ? winText : loseText;

    if (q.funFact) {
        mentorMsg.textContent = q.funFact;
        mentor.style.display = 'flex';
    } else {
        mentor.style.display = 'none';
    }

    updateHUD();
    
    document.getElementById('btn-next').onclick = () => {
        const stId = STATIONS[G.stationIdx].id;

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

const MINIGAMES = {
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
    
    document.getElementById('mg-title').textContent = mg.title;
    document.getElementById('mg-desc').textContent = mg.desc;
    document.getElementById('mg-progress-label').textContent = mg.instruction;
    
    document.getElementById('mg-result').style.display = 'none';
    document.getElementById('mg-area').style.display = 'flex';
    document.getElementById('mg-timer-bar').style.width = '100%';
    
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
        <div class="mg-lamb-body" id="mg-lamb">
            🐑
            <div class="mg-target-zone" id="mg-target"></div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text2); text-align: center;">Toque na zona amarela para injetar.</p>
    `;
    
    const target = document.getElementById('mg-target');
    const lamb = document.getElementById('mg-lamb');

    target.onclick = (e) => {
        e.stopPropagation();
        target.style.background = "var(--green2)";
        target.style.borderColor = "var(--green1)";
        target.style.animation = "none";
        G.stats.hypothermiaSaved++;
        processMinigameResult(true, "Injeção aplicada no local correto! A glicose foi para o peritônio e o animal foi salvo do choque.", "var(--green2)", "✅ Procedimento Cirúrgico");
    };

    lamb.onclick = () => {
        processMinigameResult(false, "Você errou o local e injetou no abomaso (estômago). A glicose não fará efeito e causará infecção.", "var(--red)", "❌ Erro Médico");
    };
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

function processMinigameResult(isWin, message, color, titleText) {
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
        G.survival = Math.max(0, G.survival - 10);
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
function showReport() {
    document.getElementById('rep-hits').textContent = `${G.stationHits}/${stationQuestions.length}`;
    document.getElementById('rep-survival').textContent = `${Math.round(G.survival)}%`;
    
    const learnings = document.getElementById('rep-learnings');
    learnings.innerHTML = '';
    G.stationTags.forEach(t => {
        const li = document.createElement('li'); li.textContent = `Conceitos de ${t}`;
        learnings.appendChild(li);
    });

    document.getElementById('rep-vet').textContent = "Lembre-se: O sucesso do manejo reflete no bolso. Prevenir é 10x mais barato que tratar.";
    switchScreen('screen-report');
}

function nextStation() {
    G.stationIdx++;
    loadStation();
}

function triggerGameOver(lastExplanation) {
    clearInterval(G.timerRef);
    
    const visualEl = document.getElementById('final-farm-visual');
    if (visualEl) visualEl.textContent = '🪦📉';
    
    document.getElementById('final-title').textContent = 'O Rebanho Colapsou';
    document.getElementById('final-title').style.color = 'var(--red)';
    document.getElementById('final-mode-label').textContent = 'A falta de intervenção técnica resultou em perdas irreversíveis.';
    
    document.getElementById('final-score').textContent = `Falência (R$ ${G.money})`;
    document.getElementById('final-survival').textContent = '0% - Intervenção Necessária';
    
    const strDiv = document.getElementById('final-strengths');
    if (strDiv) strDiv.innerHTML = `<strong>Causa Mortis Principal:</strong><p style="font-size:0.85rem; color:var(--text2); margin-top:8px;">${lastExplanation}</p>`;
    
    const weakDiv = document.getElementById('final-weaknesses');
    if (weakDiv) weakDiv.innerHTML = '<small>Revise os protocolos de manejo e tente novamente.</small>';
    
    switchScreen('screen-final');
}

function showFinal() {
    clearInterval(G.timerRef);
    const surv = Math.round(G.survival);
    saveToRanking(G.score, surv);
    
    const visualEl = document.getElementById('final-farm-visual');
    if (visualEl) {
        if (surv >= 90) visualEl.textContent = '🐄🚜🏡🌾';
        else if (surv >= 70) visualEl.textContent = '🏠🚜🐄';
        else if (surv >= 50) visualEl.textContent = '🏠🌾';
        else visualEl.textContent = '🏚️📉';
    }

    document.getElementById('final-title').textContent = surv >= 80 ? '🏆 Safra Concluída!' : '📚 Temporada Finalizada';
    const perfis = {leigo: 'Produtor/Iniciante', estudante: 'Estudante (Técnico)', veterinario: 'Médico Veterinário'};
    document.getElementById('final-profile').textContent = perfis[G.audience];
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
    
    document.getElementById('final-weaknesses').style.display = 'none';

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
    
    if ((G.stats.hitsByTag['hipotermia'] || 0) > 0 || (G.stats.hitsByTag['frio'] || 0) > 0 || G.stats.hypothermiaSaved > 0) {
        histHTML += `<li style="margin-bottom:4px;">✔️ Agiu rápido e reverteu quadros de choque térmico.</li>`;
    }
    if (G.stats.colostrumFails > 0 || (G.stats.missesByTag['colostro'] || 0) > 0) {
        histHTML += `<li style="margin-bottom:4px; color:var(--amber);">⚠️ Falhou na janela de ouro do colostro, gerando risco de FTPI.</li>`;
    } else if ((G.stats.hitsByTag['colostro'] || 0) > 0) {
        histHTML += `<li style="margin-bottom:4px;">✔️ Fez excelente gestão do banco de colostro e imunidade passiva.</li>`;
    }
    if ((G.stats.missesByTag['vacina'] || 0) > 0) {
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
            if (tag.includes('colostro') || tag.includes('ftpi') || tag.includes('imunidade')) recommendation = "Revisar a fisiologia da absorção de imunoglobulinas (IgG) e o tempo de fechamento intestinal (Janela de 24h).";
            else if (tag.includes('umbigo') || tag.includes('onfalite')) recommendation = "Estudar anatomia das estruturas umbilicais e a ação antisséptica e secante do Iodo 10%.";
            else if (tag.includes('frio') || tag.includes('hipotermia')) recommendation = "Revisar o catabolismo da Gordura Marrom em neonatos e os protocolos de aquecimento / injeção de glicose.";
            else if (tag.includes('vacina') || tag.includes('imunologia')) recommendation = "Revisar os conceitos de imunidade passiva vs ativa e a janela de vulnerabilidade imunológica.";
            else recommendation = `Pesquisar mais sobre protocolos e manejo relacionados a: <strong>${tag}</strong>.`;
            
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
function saveToRanking(score, survival) {
    let rank = JSON.parse(localStorage.getItem('vidasDoCampoRank')) || [];
    rank.push({ farm: G.farm, score: score, surv: survival, date: new Date().toLocaleDateString('pt-BR') });
    rank.sort((a, b) => b.score - a.score);
    rank = rank.slice(0, 10);
    localStorage.setItem('vidasDoCampoRank', JSON.stringify(rank));
}

function showRanking() { 
    const rank = JSON.parse(localStorage.getItem('vidasDoCampoRank')) || [];
    const list = document.getElementById('ranking-list');
    
    if (rank.length === 0) {
        list.innerHTML = '<p style="color: var(--text2); text-align: center; padding: 20px;">Nenhuma fazenda registrada ainda.</p>';
    } else {
        list.innerHTML = rank.map((r, i) => `
            <div class="ranking-item" style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid var(--border); align-items: center;">
                <div>
                    <strong style="color: var(--green2);">#${i+1} ${r.farm}</strong>
                    <div style="font-size: 0.75rem; color: var(--text2);">${r.date}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: var(--amber);">${r.score} pts</div>
                    <div style="font-size: 0.85rem; color: var(--text2);">${r.surv}% Vivos</div>
                </div>
            </div>
        `).join('');
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

(function init() {
    updateHUD();
})();