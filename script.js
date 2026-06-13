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
   ESTAÇÕES NARRATIVAS
─────────────────────────────────────── */
const STATIONS = [
    { id: 1, emoji: '🌸', title: 'Gestação e Pré-Parto', narrative: 'O fim da gestação define a qualidade do nascimento. A nutrição da mãe agora é o seguro de vida do filhote.' },
    { id: 2, emoji: '🍼', title: 'A Janela do Colostro', narrative: 'Um nascimento ocorreu nesta madrugada. O cronômetro da imunidade está correndo. Cada minuto sem colostro é um risco.' },
    { id: 3, emoji: '❄️', title: 'Desafio Térmico', narrative: 'Uma frente fria atingiu a fazenda. Filhotes recém-nascidos perdem calor 4x mais rápido que adultos.' },
    { id: 4, emoji: '🦠', title: 'Higiene e Infecções', narrative: 'A baia de parto esconde inimigos invisíveis. O umbigo do recém-nascido é a porta de entrada para o sistema circulatório.' },
    { id: 5, emoji: '🌿', title: 'Pico de Lactação', narrative: 'A mãe está produzindo leite ao máximo. O gasto energético dela dobrou. Se a dieta falhar, a doença metabólica ataca.' },
    { id: 6, emoji: '💉', title: 'Prevenção e Imunidade', narrative: 'Morte súbita no rebanho pode ser evitada. O protocolo vacinal da mãe dita a proteção do filhote nos primeiros meses.' },
    { id: 7, emoji: '📊', title: 'Decisões Baseadas em Dados', narrative: 'O ciclo se encerra. É hora de olhar para os números, calcular as perdas e ajustar o manejo para o próximo ano.' }
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
            "9 meses e meio para a vaca | 5 meses para a ovelha",
            "6 meses para a vaca | 9 meses para a ovelha",
            "12 meses para a vaca | 3 meses para a ovelha",
            "5 meses para a vaca | 5 meses para a ovelha"
        ],
        "correct": 0,
        "hint": "O tempo da vaca é muito parecido com o dos humanos, enquanto o da ovelha é bem mais curto.",
        "explanation": "A gestação das vacas dura em média 285 dias (aproximadamente 9 meses e meio). Já as ovelhas têm uma gestação mais rápida, durando cerca de 150 dias (5 meses). Conhecer essas datas ajuda o produtor a se preparar para o momento do parto.",
        "funFact": "Assim como nos humanos, fatores como a raça do animal e se a cria é macho ou fêmea podem adiantar ou atrasar o parto em alguns dias!"
    },
    {
        "id": 10102,
        "station": 1,
        "species": "all",
        "audience": "leigo",
        "difficulty": 2,
        "type": "prevencao",
        "tags": ["alimentacao", "gordura", "manejo"],
        "question": "Se uma vaca ou ovelha chegar muito magra ou muito gorda no momento do parto, o que pode acontecer?",
        "options": [
            "Não muda nada, o filhote nasce saudável de qualquer forma.",
            "Animais muito gordos ou magros têm mais chances de ter partos difíceis e doenças após o nascimento.",
            "Animais magros sempre produzem mais leite.",
            "Animais gordos nunca têm problemas de parto."
        ],
        "correct": 1,
        "hint": "O equilíbrio é a chave. Extremos na saúde da mãe afetam diretamente o nascimento.",
        "explanation": "O peso ideal (nem gorda, nem magra) garante que a mãe tenha força para parir e não desenvolva problemas metabólicos perigosos após o comportamento do parto, evitando a famosa síndrome da vaca caída.",
        "funFact": "O termo técnico usado por veterinários para avaliar a gordura do animal visualmente se chama Escore de Condição Corporal (ECC)."
    },
    {
        "id": 10103,
        "station": 1,
        "species": "Ovinos",
        "audience": "leigo",
        "difficulty": 3,
        "type": "prevencao",
        "tags": ["ovelha", "gemeos", "energia"],
        "question": "Maria percebeu que sua ovelha, que está esperando filhotes gêmeos e está muito magra, começou a se afastar do bando, andar em círculos e parecer cega na última semana de gestação. O que isso indica?",
        "options": [
            "A ovelha está apenas procurando um lugar calmo para dar à luz.",
            "Ela está sofrendo de uma grave falta de energia por causa dos filhotes, chamada Toxemia da Prenhez.",
            "A ovelha comeu alguma planta venenosa no pasto.",
            "É um comportamento completamente normal de ovelhas experientes."
        ],
        "correct": 1,
        "hint": "Gerar dois filhotes ao mesmo tempo exige muita energia da mãe. Se ela não comer o suficiente, o corpo dela entra em colapso.",
        "explanation": "A Toxemia da Prenhez, também conhecida como a doença da gestação gemelar, acontece quando a ovelha não consegue comer a quantidade de energia que os dois filhotes exigem. O corpo começa a queimar gordura muito rápido, gerando toxinas que afetam o cérebro do animal.",
        "funFact": "Essa doença é uma emergência! Se não tratada rapidamente com fontes de energia rápida indicadas por um veterinário, a mãe e os filhotes podem morrer."
    },
    {
        "id": 10201,
        "station": 1,
        "species": "all",
        "audience": "estudante",
        "difficulty": 1,
        "type": "interpretacao",
        "tags": ["ecc", "nutricao", "peripartal"],
        "question": "Durante a avaliação de um rebanho leiteiro no pré-parto, qual o Escore de Condição Corporal (ECC) considerado ideal para vacas holandesas na escala de 1 a 5?",
        "options": [
            "Entre 1,5 e 2,0 (Magra)",
            "Entre 3,0 e 3,25 (Moderada)",
            "Entre 4,0 e 4,5 (Gorda)",
            "A escala varia de acordo com a produção de leite anterior, não havendo padrão."
        ],
        "correct": 1,
        "hint": "Buscamos o equilíbrio para evitar tanto a mobilização excessiva de gordura quanto a falta de reservas para o pico de lactação.",
        "explanation": "O escore ideal ao parto para vacas de leite está entre 3,0 e 3,25. Animais que parem abaixo de 3,0 têm menor pico de lactação por falta de reserva energética. Animais que parem acima de 3,5 têm redução drástica no consumo de matéria seca (CMS) no pós-parto, predispondo a distocias e doenças metabólicas.",
        "funFact": "A perda de mais de 0,5 pontos de ECC no pós-parto precoce está diretamente associada ao aumento do período de serviço e queda na taxa de concepção."
    },
    {
        "id": 10202,
        "station": 1,
        "species": "Ovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "aplicacao",
        "tags": ["fisiologia", "metabolismo", "ovinos"],
        "question": "Qual a principal alteração fisiopatológica que desencadeia os sintomas neurológicos na Toxemia da Prenhez em ovelhas?",
        "options": [
            "Hipocalcemia severa decorrente da calcificação dos ossos fetais.",
            "Hipoglicemia acentuada associada à neurotoxicidade por corpos cetônicos (hipercetonemia).",
            "Hipertensão portal devido à compressão uterina sobre a veia cava inferior.",
            "Uremia aguda por falência renal compressiva."
        ],
        "correct": 1,
        "hint": "O cérebro dos ruminantes é altamente dependente de glicose. Na falta dela, o metabolismo lipídico alternativo gera subprodutos voláteis.",
        "explanation": "A alta demanda por glicose pelos fetos no terço final da gestação, associada à redução do espaço ruminal, induz um Balanço Energético Negativo (BEN). A intensa lipólise satura o fígado, levando à produção excessiva de corpos cetônicos (acetoacetato e beta-hidroxibutirato) e hipoglicemia severa, afetando o sistema nervoso central.",
        "funFact": "Diferente dos humanos, os tecidos periféricos dos ruminantes utilizam predominantemente acetato e propionato como fonte energética, poupando a glicose quase que exclusivamente para o útero gravídico e tecido nervoso."
    },
    {
        "id": 10203,
        "station": 1,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["anestro", "dietas_aniônicas", "minerais"],
        "question": "Um produtor relata alta incidência de retenção de placenta e hipocalcemia clínica (Febre do Leite) em suas vacas. Ao analisar o manejo pré-parto, você percebe o uso de dietas ricas em potássio (feno de alfafa). Qual a justificativa fisiológica para o problema?",
        "options": [
            "O potássio inibe diretamente a absorção intestinal de cálcio por competição ativa.",
            "O excesso de potássio causa alcalose metabólica, reduzindo a sensibilidade dos receptores biológicos ao Paratormônio (PTH).",
            "O potássio destrói as células da glândula paratireoide, impedindo a síntese de PTH.",
            "Dietas ricas em potássio aceleram a excreção renal de cálcio antes do parto."
        ],
        "correct": 1,
        "hint": "O PTH precisa de um ambiente com pH sanguíneo levemente acidificado para que seus receptores mudem de conformação e atuem nos ossos e rins.",
        "explanation": "Dietas ricas em cátions (como o Potássio K+) induzem alcalose metabólica nas vacas. A alcalose altera a configuração dos receptores teciduais para o PTH, impedindo que o organismo mobilize eficientemente o cálcio dos ossos para o sangue no momento do parto, culminando na hipocalcemia e atonia uterina (causa da retenção placentária).",
        "funFact": "É por isso que na nutrição moderna de vacas no pré-parto utilizam-se os famosos 'sais aniônicos' (cloretos e sulfatos) para induzir uma leve acidose metabólica controlada."
    },
    {
        "id": 10301,
        "station": 1,
        "species": "Bovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["terapeutica", "cetose", "obstetricia"],
        "question": "CASO CLÍNICO: Uma vaca multípara da raça Jersey, com 280 dias de gestação e ECC de 4,25, apresenta-se em decúbito esternal, apática, com tremores musculares periféricos e pupilas responsivas lentas. O proprietário aplicou gluconato de cálcio SC sem sucesso. Qual a conduta imediata recomendada?",
        "options": [
            "Induzir o parto com dexametasona e prostaglandina, associando infusão rápida de cálcio a 50% IV.",
            "Mensurar BHB e cálcio ionizável; instituir infusão lenta de Gluconato de Cálcio 20% (IV) sob monitoramento cardíaco, associado a propilenoglicol (VO) e glicose hipertônica (IV).",
            "Realizar cesariana de emergência imediata, sem triagem laboratorial prévia, devido ao alto risco de distocia.",
            "Administrar ocitocina IV associada a flunixin meglumine para o controle imediato dos tremores musculares."
        ],
        "correct": 1,
        "hint": "Lembre-se da sobreposição de síndromes metabólicas (hipocalcemia crônica + cetose pré-parto) em raças altamente produtivas com alto ECC.",
        "explanation": "Vacas gordas no pré-parto imediato podem desenvolver Cetose Pré-parto concomitante com Hipocalcemia Subclínica/Clínica. A terapia requer infusão lenta de cálcio IV para restabelecer a contratilidade muscular (sempre monitorando o ritmo cardíaco para evitar parada em sístole), aliada ao fornecimento de precursores glicogênicos (propilenoglicol) e glicose para frear a lipólise severa que gera a hipercetonemia.",
        "funFact": "A raça Jersey possui menor número de receptores para a Vitamina D ativa no intestino em comparação à raça Holandesa, tornando-a geneticamente muito mais predisposta à Febre do Leite."
    },

    // --- ESTAÇÃO 2: COLOSTRO ---
    {
        "id": 20101,
        "station": 2,
        "species": "all",
        "audience": "leigo",
        "difficulty": 1,
        "type": "conceitual",
        "tags": ["colostro", "leite", "protecao"],
        "question": "🍼 O que é o colostro e qual a sua principal função para o filhote que acabou de nascer?",
        "options": [
            "É um leite fraco que serve apenas para hidratar a cria nas primeiras semanas.",
            "É o primeiro leite da mãe, rico em energia e anticorpos, funcionando como a primeira 'vacina' natural do filhote.",
            "É uma secreção perigosa que deve ser descartada antes do filhote mamar.",
            "É um alimento artificial que substitui o leite de transição."
        ],
        "correct": 1,
        "hint": "Os filhotes nascem sem nenhuma proteção contra as bactérias do ambiente. Eles dependem 100% desse primeiro alimento.",
        "explanation": "O colostro é o primeiro leite produzido pela mãe logo após o parto. Ele é altamente concentrado em nutrientes, gorduras e, principalmente, em imunoglobulinas (anticorpos), que protegem o recém-nascido contra doenças infecciosas até que seu próprio corpo aprenda a se defender.",
        "funFact": "Ao contrário dos bebês humanos, que recebem proteção da mãe ainda dentro do útero pela placenta, os bezerros e cordeiros nascem com 'zero' defesas corporais!"
    },
    {
        "id": 20102,
        "station": 2,
        "species": "Bovinos",
        "audience": "leigo",
        "difficulty": 2,
        "type": "aplicacao",
        "tags": ["tempo", "absorcao", "bezerro"],
        "question": "Qual é o tempo limite ideal para que um bezerro mame o colostro pela primeira vez para garantir o máximo de proteção?",
        "options": [
            "Nas primeiras 2 horas de vida.",
            "Até o segundo dia após o nascimento.",
            "Apenas após 24 horas de vida, quando o estômago estiver maduro.",
            "Qualquer momento dentro da primeira semana de vida."
        ],
        "correct": 0,
        "hint": "O intestino do filhote funciona como uma janela aberta que vai se fechando muito rápido após o nascimento.",
        "explanation": "As primeiras 2 horas são de ouro! O intestino do recém-nascido consegue absorver as defesas do colostro inteiras diretamente para o sangue. Após 6 horas, essa capacidade cai pela metade, e após 24 horas, a janela se fecha completamente, e o colostro não protege mais o sangue do animal.",
        "funFact": "Se o filhote não receber o colostro nas primeiras horas, ele pode sofrer de Falha de Transferência de Imunidade Passiva (FTIP), ficando vulnerável a qualquer bactéria boba do ambiente."
    },
    {
        "id": 20201,
        "station": 2,
        "species": "all",
        "audience": "estudante",
        "difficulty": 1,
        "type": "interpretacao",
        "tags": ["imunologia", "igg", "placenta"],
        "question": "Por que os bezerros e cordeiros dependem exclusivamente do colostro para a aquisição de imunoglobulinas G (IgG), diferentemente dos primatas?",
        "options": [
            "Porque o sistema imune dos ruminantes destrói os anticorpos maternos via circulação fetal.",
            "Devido ao tipo de placenta dos ruminantes (sinepiteliocorial), que impede a passagem de macromoléculas proteicas durante a gestação.",
            "Porque os filhotes só ativam a produção de linfócitos após o estímulo mecânico da mamada.",
            "Pelo fato de o colostro de ruminantes possuir pH ácido que ativa os anticorpos estocados no fígado fetal."
        ],
        "correct": 1,
        "hint": "Observe a quantidade de camadas celulares que separam o sangue da mãe do sangue do feto na estrutura uterina dessas espécies.",
        "explanation": "A placenta dos ruminantes é do tipo Sinepiteliocorial (ou Epiteliocorial modificada), possuindo seis camadas de tecidos que separam a circulação materna da fetal. Essa barreira física impede totalmente a passagem de grandes proteínas, como as imunoglobulinas, fazendo com que o neonato nasça em estado de agamaglobulinemia (sem anticorpos circulantes).",
        "funFact": "Os cães e gatos possuem placenta endoteliocorial, permitindo que cerca de 5% a 10% dos anticorpos passsem durante a gestação, enquanto os humanos (hemocorial) recebem quase 100% via placenta."
    },
    {
        "id": 20202,
        "station": 2,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "interpretacao",
        "tags": ["colostrometro", "refratometro", "qualidade"],
        "question": "Ao utilizar um refratômetro de Brix para avaliar a qualidade do colostro bovino na fazenda, qual o valor de corte em porcentagem (%) que indica um colostro de excelente qualidade (superior a 50 mg/mL de IgG)?",
        "options": [
            "Abaixo de 18% Brix",
            "Entre 19% e 21% Brix",
            "Igual ou superior a 22% Brix",
            "O refratômetro de Brix avalia apenas açúcar, não servindo para anticorpos."
        ],
        "correct": 2,
        "hint": "Um valor alto de Brix correlaciona-se diretamente com uma alta densidade de proteínas totais na secreção.",
        "explanation": "Um valor de ≥ 22% no Refratômetro de Brix indica um colostro de alta qualidade, contendo pelo menos 50 g de IgG por litro. Colostros abaixo desse valor devem ser descartados (ou fornecidos apenas para animais mais velhos como nutrição simples) e substituídos por colostro de banco com qualidade validada.",
        "funFact": "O colostrómetro tradicional de vidro avalia a densidade baseado na gravidade específica, mas sofre interferência direta se o colostro estiver frio ou quente demais, enquanto o refratômetro de Brix exige apenas duas gotas e é super estável!"
    },
    {
        "id": 20301,
        "station": 2,
        "species": "Bovinos",
        "audience": "veterinario",
        "difficulty": 2,
        "type": "calculo",
        "tags": ["dosagem", "manejo", "imunidade"],
        "question": "Deseja-se colostrar um bezerro neonato da raça Holandesa com peso vivo estimado em 40 kg nas primeiras 2 horas de vida. Sabendo que a recomendação técnica atual para garantir a transferência de imunidade passiva eficiente é de fornecer 10% do peso vivo na primeira mamada, qual o volume exato a ser administrado?",
        "options": [
            "2,0 Litros",
            "4,0 Litros",
            "6,0 Litros",
            "1,5 Litros"
        ],
        "correct": 1,
        "hint": "Basta realizar o cálculo simples de porcentagem sobre a massa do animal.",
        "explanation": "Para um animal de 40 kg, 10% do peso corporal equivale a 4,0 litros de colostro de alta qualidade. Esse volume garante a ingestão mínima de 150 a 200g de IgG puras necessárias para atingir níveis séricos de segurança (> 10 mg/mL de IgG no soro do bezerro após 24h).",
        "funFact": "Fornecer 4 litros via mamadeira pode ser difícil pelo cansaço do neonato; nesses casos, o uso técnico da Sonda Esofágica é altamente recomendado e seguro se posicionado corretamente no esôfago."
    },
    {
        "id": 20302,
        "station": 2,
        "species": "Ovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["ftpi", "soro", "ovinos"],
        "question": "CASO CLÍNICO: Um lote de cordeiros de 36 horas apresenta falha generalizada de transferência de imunidade passiva (FTPI) confirmada laboratorialmente (PT < 5,0 g/dL). O rebanho enfrenta um surto ativo de diarreia por E. coli. Qual a conduta emergencial mais eficaz?",
        "options": [
            "Fornecer 200 mL de colostro bovino via sonda esofágica imediatamente.",
            "Administrar via intraperitoneal (IP) 20 a 40 mL/kg de plasma ou soro hiperimune homólogo obtido de doadores adultos sadios e vacinados do próprio rebanho.",
            "Instituir antibioticoterapia preventiva em massa com oxitetraciclina LA e isolar o lote em abrigo aquecido.",
            "Fornecer substituto comercial de colostro por via oral adicionado de promotores de crescimento."
        ],
        "correct": 1,
        "hint": "Como a janela de absorção intestinal já fechou (> 24h), anticorpos dados via oral atuarão apenas localmente e não passarão para o sangue.",
        "explanation": "Após 24-36 horas de vida, os enterócitos do neonato já sofreram o processo de 'closure' (fechamento), impedindo a absorção sistêmica de anticorpos por via oral. A única forma de fornecer imunidade humoral imediata para salvar os animais do surto de diarreia é injetando os anticorpos prontos diretamente na cavidade peritoneal (transfusão de plasma/soro), onde serão absorvidos via linfática para o sangue.",
        "funFact": "O soro de doadores da própria fazenda é excelente porque já contém anticorpos específicos contra as bactérias mutadas daquele ambiente específico!"
    },

    // --- ESTAÇÃO 3: HIPOTERMIA NEONATAL ---
    {
        "id": 30101,
        "station": 3,
        "species": "Ovinos",
        "audience": "leigo",
        "difficulty": 1,
        "type": "prevencao",
        "tags": ["frio", "cordeiro", "aquecimento"],
        "question": "❄️ Um cordeiro nasceu em uma noite fria e chuvosa. Ele está deitado, tremendo muito, com as orelhas caídas e com a boca gelada. Qual deve ser sua primeira atitude?",
        "options": [
            "Dar um banho de água fria para ele acordar.",
            "Secar o filhote imediatamente com panos limpos, levá-lo para um local sem vento e usar uma fonte de calor (como uma lâmpada quente ou caixas de aquecimento).",
            "Deixá-lo no pasto para que ele aprenda a sobreviver sozinho no tempo.",
            "Forçar o filhote a correr para esquentar o corpo."
        ],
        "correct": 1,
        "hint": "Filhotes molhados perdem calor para o vento muito rápido. O calor externo e a secagem protegem a vida dele.",
        "explanation": "Os cordeiros nascem molhados e têm pouca gordura no corpo. Se pegarem vento ou frio, a temperatura do corpo despenca (hipotermia). Secar o filhote tira a umidade que gela a pele, e a fonte de calor ajuda o corpo dele a voltar para a temperatura normal de forma segura.",
        "funFact": "Cavalos e vacas aguentam o frio um pouco melhor, mas os cordeiros nascem muito pequenos e perdem calor até 4 vezes mais rápido!"
    },
    {
        "id": 30201,
        "station": 3,
        "species": "Ovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "aplicacao",
        "tags": ["gordura_marrom", "fisiologia", "termogenese"],
        "question": "Qual o principal mecanismo fisiológico de termogênese química (produção de calor sem tremores) utilizado por cordeiros recém-nascidos nas primeiras horas de vida?",
        "options": [
            "Fermentação bacteriana acelerada no rúmen.",
            "Catabolismo do tecido adiposo marrom (gordura marrom) através da ativação da proteína desacopladora 1 (UCP-1).",
            "Glicogenólise muscular induzida por altos níveis de cortisol materno.",
            "Vasoconstrição periférica severa mediada por acetilcolina."
        ],
        "correct": 1,
        "hint": "Trata-se de um tipo especial de tecido gorduroso, altamente vascularizado, localizado ao redor dos rins e do coração do neonato.",
        "explanation": "Os neonatos de ruminantes possuem depósitos de Tecido Adiposo Marrom (TAM). Sob o estímulo do frio, o sistema nervoso simpático libera noradrenalina, ativando a UCP-1 (Termogenina) nas mitocôndrias desse tecido. Em vez de produzir ATP (energia química), a célula queima a gordura liberando diretamente CALOR para o sangue.",
        "funFact": "Esse estoque de gordura marrom é limitado e dura apenas cerca de 24 a 48 horas após o nascimento. Se o animal não mamar nesse período, a lenha dessa fogueira acaba e ele morre de frio!"
    },
    {
        "id": 30301,
        "station": 3,
        "species": "Ovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["glicose", "intraperitoneal", "emergencia"],
        "question": "CASO CLÍNICO: Cordeiro de 12 horas de vida é encontrado em decúbito lateral em piquete úmido. Temperatura retal de 35,5°C (hipotermia severa) e ausência completa dos reflexos de deglutição e sucção. Qual o protocolo imediato obrigatório?",
        "options": [
            "Fornecer 100 mL de colostro hiperaquecido a 50°C via sonda esofágica antes do aquecimento.",
            "Administrar Glicose 20% por via intraperitoneal (10 mL/kg, morna) e, na sequência, instituir aquecimento gradual externo por ar forçado.",
            "Aplicar dexametasona IM e realizar imersão imediata do neonato em banho-maria a 42°C.",
            "Efetuar massagem vigorosa em todo o corpo com álcool iodado e administrar solução eletrolítica oral."
        ],
        "correct": 1,
        "hint": "Se você aquecer externamente um animal hipotérmico que está sem reservas de açúcar no sangue, o cérebro dele entrará em colapso por falta de glicose (choque hipoglicêmico).",
        "explanation": "Cordeiro com hipotermia severa (< 37°C) e há mais de 6 horas de vida esgotou suas reservas de glicogênio e gordura marrom. Aquecê-lo sem corrigir a glicose acelera o metabolismo periférico, consumindo o restinho de açúcar do cérebro, gerando convulsão e morte. O protocolo exige Glicose Intraperitoneal morna para absorção rápida, seguida de aquecimento.",
        "funFact": "A injeção intraperitoneal é feita inserindo a agulha a cerca de 1,5 cm ao lado do umbigo e direcionada para o quadril do animal. É um procedimento de campo simples que salva milhares de cordeiros."
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
        "question": "🧴 Qual é a forma correta e o produto mais indicado para tratar o umbigo do filhote assim que ele nasce?",
        "options": [
            "Apenas passar um spray 'mata-bicheira' azul por fora.",
            "Mergulhar o umbigo inteiro dentro de um copinho com Iodo a 10% por pelo menos 30 segundos, repetindo nos primeiros dias.",
            "Lavar com água e sabão e cobrir com uma faixa limpa.",
            "Não precisa fazer nada, o umbigo seca sozinho com o vento."
        ],
        "correct": 1,
        "hint": "O umbigo quebrado funciona como uma tubulação aberta que vai direto para o coração e fígado do filhote. O produto precisa desinfetar e secar essa estrutura.",
        "explanation": "O umbigo é a principal porta de entrada para bactérias perigosas. O Iodo de 7% a 10% (como a tintura de iodo) mata os germes e desidrata o cordão (faz o umbigo 'secar' e cair). Mergulhar garante que o líquido entre em todo o canal, protegendo o filhote de infecções graves sem agredir quimicamente a pele abdominal.",
        "funFact": "Infecções de umbigo mal cuidadas podem causar uma doença chamada 'mal do caruara' ou 'junta boba', onde as bactérias viajam pelo sangue e se alojam nas articulações do filhote, deixando-o aleijado!"
    },
    {
        "id": 40201,
        "station": 4,
        "species": "all",
        "audience": "estudante",
        "difficulty": 2,
        "type": "interpretacao",
        "tags": ["onfaloflebite", "onfalite", "ultrassonografia"],
        "question": "Um bezerro de 15 dias apresenta flutuação e aumento de volume na região umbilical, dor à palpação e febre intermitente. Quais as estruturas anatômicas internas derivadas do cordão umbilical que podem estar envolvidas nessa infecção (onfaloflebite/onfaloarterite)?",
        "options": [
            "Apenas a pele externa e o tecido subcutâneo do abdômen.",
            "A veia umbilical (que vai ao fígado), as duas artérias umbilicais (ligadas às artérias ilíacas) e o úraco (comunicação com a bexiga).",
            "O ducto colédoco e a artéria mesentérica cranial.",
            "O estômago verdadeiro (abomaso) e o ligamento falciforme."
        ],
        "correct": 1,
        "hint": "O cordão umbilical do feto contém vasos sanguíneos de alta importância circulatória e um canal urinário de descarte.",
        "explanation": "A infecção do umbigo pode progredir internamente por quatro caminhos: pela Veia Umbilical (causando abscesso hepático por Onfaloflebite), pelas Artérias Umbilicais (Onfaloarterite) ou pelo Úraco (causando anatomicamente uma cistite ou abscesso uracal). O diagnóstico preciso exige palpação profunda ou ultrassonografia.",
        "funFact": "Quando o úraco não fecha direito devido a infecções, o filhote pode ficar gotejando urina pelo umbigo, uma condição chamada de úraco persistente."
    },
    {
        "id": 40301,
        "station": 4,
        "species": "Bovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["diarreia", "acidose", "reidratação"],
        "question": "CASO CLÍNICO: Bezerro de 7 dias apresenta diarreia aquosa profusa há 48 horas, decúbito esternal permanente, perda do reflexo de sucção, enofalmia severa (> 5 mm) e turgor cutâneo de 8 segundos. Qual o diagnóstico hemodinâmico e conduta imediata?",
        "options": [
            "Desidratação leve (5%) sem distúrbio ácido-base; administrar solução eletrolítica oral a cada 2 horas.",
            "Desidratação grave (10-12%) com acidose metabólica severa e choque hipovolêmico; instituir fluidoterapia intravenosa imediata com soluções alcalinizantes (Bicarbonato de Sódio 1,3% ou Ringer Lactato).",
            "Coccidiose aguda com choque endotóxico; realizar aplicação de sulfas IM e suspender o fornecimento hídrico.",
            "Septicemia secundária por Salmonella; administrar corticoterapia de alta potência e transfusão sanguínea total."
        ],
        "correct": 1,
        "hint": "Animais caídos com perda de sucção e olhos fundos já perderam mais de 10% do peso em água e estão em acidose severa. A via oral é contraindicada pelo risco de atonia gastrointestinal.",
        "explanation": "O quadro clínico descreve um estado crítico de desidratação severa com choque endotóxico/hipovolêmico e acidose metabólica (causada pela perda de bicarbonato nas fezes e acúmulo de lactato D- e L-). O tratamento de eleição é a reposição volêmica imediata por via IV com soluções alcalinizantes para restaurar a perfusão tecidual e corrigir o pH sanguíneo.",
        "funFact": "A velocidade de hidratação em bezerros pode ser agressiva: pode-se infundir até 80 mL/kg nas primeiras 2 a 4 horas de tratamento sob monitoramento pulmonar."
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
        "question": "🌿 Qual o nutriente mais importante e mais barato que uma mãe em lactação precisa receber em grande quantidade para produzir bastante leite?",
        "options": [
            "Sal mineral importado.",
            "Água limpa e fresca à vontade.",
            "Ração concentrada com alto teor de farelo de soja.",
            "Vitaminas injetáveis aplicadas diariamente."
        ],
        "correct": 1,
        "hint": "O leite é composto por mais de 80% deste ingrediente. Se faltar, a produção cai no mesmo dia.",
        "explanation": "A água é o nutriente mais crítico para fêmeas lactantes. Uma vaca de alta produção pode beber mais de 100 a 140 litros de água por dia. Se o acesso à água for difícil ou se a água estiver suja, o consumo cai, reduzindo imediatamente a produção de leite e prejudicando os filhotes.",
        "funFact": "As ovelhas que amamentam gêmeos chegam a aumentar o consumo de água em até 50% em comparação com as que cuidam de apenas um cordeiro!"
    },
    {
        "id": 50201,
        "station": 5,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "aplicacao",
        "tags": ["rumen", "fga", "concentrado"],
        "question": "O fornecimento excessivo de concentrados (grãos/amido) para vacas no pós-parto imediato, na tentativa de aumentar a energia da dieta de forma abrupta, predispõe a qual patologia ruminal?",
        "options": [
            "Alcalose Ruminal por excesso de ureia.",
            "Acidose Ruminal Subaguda (SARA) devido ao acúmulo de Ácidos Graxos Voláteis (AGVs) e queda do pH ruminal para valores abaixo de 5,5.",
            "Timpanismo gasoso por falta de motilidade do omaso.",
            "Paraqueratose intestinal decorrente de deficiência de fibra digestível."
        ],
        "correct": 1,
        "hint": "Os carboidratos de rápida fermentação são rapidamente digeridos pelas bactérias amylolíticas, gerando ácidos que reduzem o pH do ambiente.",
        "explanation": "O aumento rápido de grãos sem adaptação da microbiota ruminal provoca surtos de fermentação lática e acúmulo de Ácidos Graxos Voláteis. O pH do rúmen cai abaixo de 5,5, destruindo as bactérias celulolíticas (que digerem fibra) e lesionando a parede ruminal, o que pode causar laminite (manqueira) e abcessos hepáticos.",
        "funFact": "A SARA é conhecida como a doença silenciosa dos rebanhos leiteiros modernos de alta produção, pois muitas vezes o único sintoma visível é a oscilação na gordura do leite."
    },
    {
        "id": 50301,
        "station": 5,
        "species": "Ovinos",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "caso_clinico",
        "tags": ["hipocalcemia", "ovinos", "terapeutica"],
        "question": "Analise o caso: Ovelha de alta produção, 14 dias pós-parto, apresenta tremores na cabeça, andar rígido, evolução para decúbito esternal com o pescoço em 'S' e ausência de reflexo pupilar. Qual o diagnóstico e conduta indicados?",
        "options": [
            "Suspeita de Raiva ovina; realizar eutanásia humanitária imediata para coleta de material encefálico.",
            "Hipocalcemia da Lactação; administrar de 50 a 100 mL de Gluconato de Cálcio a 20% via intravenosa lenta sob monitoramento cardíaco contínuo.",
            "Polioencefalomalácia severa; aplicar altas doses de Tiamina (Vitamina B1) via intramuscular de 4 em 4 horas.",
            "Listeriose em estágio inicial; instituir antibioticoterapia massiva com benzilpenicilinas por via subcutânea."
        ],
        "correct": 1,
        "hint": "A postura em 'S' do pescoço em decúbito é o sinal clássico da paralisia flácida muscular causada pelo esgotamento de cálcio extracelular circulante utilizado na síntese de leite.",
        "explanation": "Embora mais rara em ovelhas do que em vacas, a hipocalcemia pós-parto ocorre em animais com alto potencial genético para lactação ou erros de balanço mineral na dieta. O cálcio é vital para a liberação de acetilcolina na fenda sináptica; sua falta causa bloqueio neuromuscular. A resposta clínica ao gluconato de cálcio IV lento é diagnóstica, com o animal levantando minutos após a aplicação.",
        "funFact": "Durante a aplicação de cálcio intravenoso, o veterinário DEVE manter o estetoscópio no coração do animal. Se houver arritmia ou bradicardia severa, a aplicação deve ser interrompida imediatamente para evitar parada cardíaca em sístole."
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
        "question": "💉 Por que é altamente recomendado vacinar as vacas e ovelhas prenhas cerca de 1 mês antes do parto?",
        "options": [
            "Para fazer a mãe emagrecer antes do parto.",
            "Para que ela produza um colostro super potente e cheio de anticorpos que vão proteger o filhote assim que ele mamar.",
            "A vacina serve apenas para proteger a mãe, não influenciando no filhote.",
            "Para evitar que o leite da mãe azede na ordenha."
        ],
        "correct": 1,
        "hint": "A mãe transfere os anticorpos que ela fabrica no sangue diretamente para o primeiro leite nas semanas que antecedem o parto.",
        "explanation": "Quando vacinamos a fêmea no terço final da gestação (aproximadamente 30 a 45 dias antes do parto), damos tempo para o corpo dela produzir altos níveis de anticorpos contra doenças graves (como o tétano e as diarreias). Esses anticorpos migram do sangue para o úbere, concentrando-se no colostro que o filhote ingerirá.",
        "funFact": "Essa estratégia inteligente de manejo se chama 'Imunização Materna' ou vacinação de pré-parto, sendo a forma mais barata de proteger os recém-nascidos!"
    },
    {
        "id": 60201,
        "station": 6,
        "species": "Ovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "prevencao",
        "tags": ["clostridiose", "pulpy_kidney", "toxinas"],
        "question": "Qual das seguintes enfermidades clostridiais é conhecida como 'Doença do Rim Polposo' (Enterotoxemia), comum em cordeiros em crescimento criados intensivamente, cujas mães não foram vacinadas no pré-parto?",
        "options": [
            "Infecção por Clostridium tetani.",
            "Enterotoxemia por Clostridium perfringens Tipo D.",
            "Carbúnculo Sintomático por Clostridium chauvoei.",
            "Botulismo por Clostridium botulinum Tipo C."
        ],
        "correct": 1,
        "hint": "Esta bactéria se prolifera rapidamente no intestino quando há excesso de amido ou mudanças bruscas na dieta, liberando a toxina épsilon.",
        "explanation": "O Clostridium perfringens tipo D produz a toxina épsilon sob dietas ricas em concentrado. A toxina causa danos severos nos vasos sanguíneos, levando a edema cerebral e autólise rápida dos rins pós-morte (daí o nome 'rim polposo'). A prevenção ideal é a vacinação das mães no pré-parto para garantir IgG via colostro.",
        "funFact": "Curiosamente, essa doença costuma acometer os melhores e mais gordos cordeiros do lote, ocorrendo de forma fulminante (morte súbita)."
    },
    {
        "id": 60301,
        "station": 6,
        "species": "all",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "aplicacao",
        "tags": ["imunologia", "anticorpos_maternos", "janela_imunológica"],
        "question": "Qual a justificativa fisiológica para evitar a vacinação de cordeiros ou bezerros contra patógenos sistêmicos na primeira semana de vida?",
        "options": [
            "Incapacidade congênita do sistema imune neonatal em processar e reconhecer antígenos proteicos.",
            "Neutralização dos antígenos vacinais pelos altos títulos de anticorpos maternos (IgG) circulantes adquiridos via colostro.",
            "Risco de involução precoce do timo induzida por adjuvantes vacinais oleosos.",
            "Baixa taxa de absorção farmacocinética no tecido subcutâneo, predispondo a choques anafiláticos."
        ],
        "correct": 1,
        "hint": "Os anticorpos da mãe circulando no sangue do filhote ligam-se aos antígenos da vacina e os destroem antes que os linfócitos do próprio filhote possam 'aprender' com a vacina.",
        "explanation": "A imunidade passiva (anticorpos maternos) exerce um efeito de feedback negativo na síntese de anticorpos endógenos. Se vacinamos o filhote enquanto o título de anticorpos colostrais está alto, ocorre a neutralização do antígeno vacinal. Deve-se aguardar o declínio natural desses anticorpos (geralmente entre 60 e 90 dias de vida) para iniciar o protocolo vacinal primário.",
        "funFact": "Essa fase onde os anticorpos maternos estão baixando (não protegendo mais contra infecções de campo) mas ainda estão altos o suficiente para anular a vacina chama-se 'Janela de Vulnerabilidade Imunológica'."
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
        "question": "📊 Em uma fazenda de gado ou ovelhas bem administrada, qual é a taxa máxima aceitável de mortalidade de filhotes no primeiro mês de vida?",
        "options": [
            "Até metade dos filhotes nascidos (50%).",
            "O ideal é ficar abaixo de 5% a 8% do total de nascidos vivos.",
            "Perder até 25% é considerado normal em qualquer fazenda.",
            "A mortalidade não importa, desde que o preço da carne esteja alto."
        ],
        "correct": 1,
        "hint": "A meta deve ser sempre baixa. Perder muitos filhotes indica falhas graves no manejo e prejuízo financeiro certo.",
        "explanation": "Propriedades eficientes mantêm a Taxa de Mortalidade Neonatal (TMN) abaixo de 5% para bezerras leiteiras e abaixo de 8% para cordeiros. Valores acima disso acendem o sinal de alerta para revisar a higiene das baias, a colostragem e o tratamento de umbigo.",
        "funFact": "Reduzir a mortalidade de 15% para 5% pode salvar dezenas de animais por ano, pagando com folga os custos de contratação de assistência técnica veterinária!"
    },
    {
        "id": 70201,
        "station": 7,
        "species": "Bovinos",
        "audience": "estudante",
        "difficulty": 2,
        "type": "calculo",
        "tags": ["tmn", "indicador", "zootecnia"],
        "question": "Uma propriedade leiteira registrou o nascimento de 120 bezerras vivas durante o ano. Destas, 12 morreram antes de completar 28 dias devido a complicações de diarreia. Qual a Taxa de Mortalidade Neonatal (TMN) do rebanho?",
        "options": [
            "TMN de 1,2% | Índice considerado excelente e dentro dos padrões internacionais.",
            "TMN de 10% | Índice alarmante, indicando que a propriedade está perdendo o dobro do limite técnico aceitável (< 5%).",
            "TMN de 20% | Falha crítica total do sistema de dejetos e pastejo.",
            "TMN de 5% | Dentro da meta estipulada para a pecuária leiteira tropical."
        ],
        "correct": 1,
        "hint": "Realize o cálculo: (Número de Mortes / Total de Nascidos Vivos) vezes 100. Compare o resultado com a meta de 5%.",
        "explanation": "Cálculo: (12 / 120) * 100 = 10%. O limite máximo recomendado para bezerras de leite é de 5%. Uma taxa de 10% dobra o limite aceitável, apontando para graves gargalos na colostragem, no manejo sanitário do bezerreiro ou na exposição a patógenos ambientais.",
        "funFact": "A taxa de mortalidade neonatal é um dos principais componentes do Índice de Eficiência Zootécnica de propriedades modernas."
    },
    {
        "id": 70301,
        "station": 7,
        "species": "all",
        "audience": "veterinario",
        "difficulty": 3,
        "type": "calculo",
        "tags": ["roi", "custo_beneficio", "planejamento"],
        "question": "Um rebanho de 500 matrizes ovinas possui TMN histórica de 18% por hipotermia. Você propõe melhorias estruturais de R$ 5.000,00 para reduzir a TMN para 6%. Considerando o cordeiro desmamado a R$ 300,00, qual o retorno financeiro?",
        "options": [
            "Impacto econômico nulo ou negativo no curto prazo, inviabilizando o projeto de investimento.",
            "Ganho bruto de R$ 18.000,00 e ROI de 260% (lucro líquido de R$ 13.000,00 sobre o custo da intervenção).",
            "Ganho bruto de R$ 36.000,00 e ROI de 500% em cenários epidemiológicos controlados.",
            "Aumento exclusivo de bem-estar animal sem impacto quantificável no fluxo de caixa da propriedade."
        ],
        "correct": 1,
        "hint": "Primeiro calcule quantos cordeiros a menos morrerão: 500 x (0,18 - 0,06). Depois multiplique pelo valor do cordeiro e calcule o ROI líquido sobre o custo.",
        "explanation": "Redução da mortalidade: 18% - 6% = 12% de economia de vidas. Em 500 partos, isso representa 500 x 0,12 = 60 cordeiros salvos. Valor gerado: 60 x R$ 300,00 = R$ 18.000,00. Retorno Líquido: R$ 18.000,00 - R$ 5.000,00 = R$ 13.000,00. ROI = (13000 / 5000) * 100 = 260%. Demonstração clara de viabilidade econômica do manejo veterinário.",
        "funFact": "Mostrar gráficos de ROI e impacto financeiro direto é a ferramenta mais poderosa que um Médico Veterinário consultor possui para convencer produtores tradicionais a adotarem novas tecnologias."
    }
];

Object.freeze(CAMPUS_LIVES_QUIZ_DATABASE);

/* ==========================================================================
   CORREÇÃO CRÍTICA 1.2: MOTOR DE COMPENSAÇÃO E FALLBACK DE QUESTÕES
   Garante balanceamento matemático: exatamente 3 perguntas por fase.
   ========================================================================== */
function getQuestionsForProfile(stationId, species, audience) {
    // 1. Filtro estrito por estação e público alvo do jogador
    let pool = CAMPUS_LIVES_QUIZ_DATABASE.filter(q => 
        q.station === stationId && 
        q.audience === audience &&
        (q.species === 'all' || q.species === species)
    );
    
    // 2. Proteção de Escopo: Se o banco estiver curto, busca itens universais do MESMO público
    if (pool.length < 3) {
        const backupMatches = CAMPUS_LIVES_QUIZ_DATABASE.filter(q => 
            q.station === stationId && 
            q.audience === audience && 
            !pool.some(p => p.id === q.id)
        );
        pool = pool.concat(backupMatches);
    }
    
    // 3. Fallback de Segurança Máxima: Se o banco quebrar, impede falha catastrófica de script
    if (pool.length === 0) {
        pool = CAMPUS_LIVES_QUIZ_DATABASE.filter(q => q.station === stationId);
    }
    
    // Embaralha e entrega exatamente a cota de equilíbrio pedagógico (3)
    return pool.sort(() => Math.random() - 0.5).slice(0, 3);
}

/* ───────────────────────────────────────
   NAVEGAÇÃO E SETUP
─────────────────────────────────────── */
function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) { el.classList.add('active'); el.scrollTop = 0; }
    G.prevScreen = id;
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
    fill.style.width = pct + '%';
    fill.style.background = pct > 60 ? 'linear-gradient(90deg,var(--green2),var(--green1))' : pct > 30 ? 'linear-gradient(90deg,var(--amber2),var(--amber))' : 'linear-gradient(90deg,#d94040,#a02020)';
    document.getElementById('hud-survival-label').textContent = 'SOBREVIVÊNCIA ' + pct + '%';
}

function animateHUDElement(elementId, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.classList.remove('hud-pulse-pos', 'hud-pulse-neg');
    void el.offsetWidth; // Trigger reflow
    
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

    // Solução robusta: Localiza o elemento de forma segura sem depender do objeto 'event' global
    const targetCard = Array.from(document.querySelectorAll('.profile-card')).find(c => {
        const attr = c.getAttribute('onclick');
        return attr && attr.includes(`'${prof}'`);
    });

    if (targetCard) {
        targetCard.classList.add('selected');
    }
    setTimeout(() => startGame(), 400);
}

function startGame() {
    G.money = 100; G.score = 0; G.hearts = 5; G.survival = 100;
    G.stationIdx = 0;
    // Reseta todas as flags de minijogos
    G.mgIodoDone = false; G.mgColostroDone = false; G.mgHipoDone = false; G.mgDietaDone = false;
    
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
    
    document.getElementById('intro-badge').textContent = `Etapa ${st.id} de 7`;
    document.getElementById('intro-emoji').textContent = st.emoji;
    document.getElementById('intro-title').textContent = st.title;
    document.getElementById('narrative-event').textContent = `"${st.narrative}"`;
    document.getElementById('intro-text').textContent = 'O conhecimento aplicado agora define o sucesso do ano todo.';
    
    switchScreen('screen-station-intro');
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
    
    // CORREÇÃO CRÍTICA 1: Geração dinâmica e reativa dos Progress Dots da HUD do Quiz
    const dotsContainer = document.getElementById('progress-dots');
    dotsContainer.innerHTML = '';
    stationQuestions.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'q-dot';
        if (i === G.questionIdx) {
            dot.classList.add('active');
        } else if (i < G.questionIdx) {
            // Como o fluxo é linear, os anteriores já foram respondidos
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
            document.getElementById('hint-text').textContent = `💡 Consultoria: ${hints[G.hintStep]}`;
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

        // CORREÇÃO 2.1: Incrementa a telemetria correta associada ao manejo do colostro e FTPI
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
    
    const startHold = (e) => {
        e.preventDefault();
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

/* --- LÓGICA: COLOSTRO (Mecânica: Barra de Tensão / Hold) --- */
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
    let isHeating = false;

    const heatUp = (e) => {
        e.preventDefault();
        if(isHeating) return;
        isHeating = true;
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
        if(!isHeating) return;
        clearInterval(mgHoldTimer);
        isHeating = false;
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

/* --- LÓGICA: HIPOTERMIA (Mecânica: Precisão / Tap) --- */
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
        processMinigameResult(true, "Injeção aplicada no local correto! A glicose foi para o peritônio e o animal foi salvo do choque.", "var(--green2)", "✅ Procedimento Cirúrgico");
    };

    lamb.onclick = () => {
        processMinigameResult(false, "Você errou o local e injetou no abomaso (estômago). A glicose não fará efeito e causará infecção.", "var(--red)", "❌ Erro Médico");
    };
}

/* --- LÓGICA: DIETA (Mecânica: Slider Range) --- */
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

/* --- LÓGICA CENTRAL DE RESULTADOS (DRY - Don't Repeat Yourself) --- */
function processMinigameResult(isWin, message, color, titleText) {
    document.getElementById('mg-area').style.display = 'none';
    const resBox = document.getElementById('mg-result');
    const title = document.getElementById('mg-result-title');
    const cons = document.getElementById('mg-consequence');
    
    // Captura o botão de continuar para controle de Game Over
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

    // CORREÇÃO 2.2: Bloqueio imediato do relógio e HUD caso ocorra colapso letal no minijogo
    if (G.hearts <= 0 || G.survival <= 0) {
        if (G.timerRef) clearInterval(G.timerRef);
        btnContinue.style.display = 'none';
        setTimeout(() => triggerGameOver("Falha fatal durante procedimento prático de campo."), 1500);
    } else {
        btnContinue.style.display = 'inline-block';
    }
}

function finishMinigame() {
    // CORREÇÃO CRÍTICA 1: Força o retorno visual para a tela de Quiz
    switchScreen('screen-quiz');
    nextQuestion();
}

function nextQuestion() {
    const stId = STATIONS[G.stationIdx].id;

    // Interceptadores de Ritmo (Pacing) dos Minijogos
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
    visualEl.textContent = '🪦📉';
    
    document.getElementById('final-title').textContent = 'O Rebanho Colapsou';
    document.getElementById('final-title').style.color = 'var(--red)';
    document.getElementById('final-mode-label').textContent = 'A falta de intervenção técnica resultou em perdas irreversíveis.';
    
    document.getElementById('final-score').textContent = `Falência (R$ ${G.money})`;
    document.getElementById('final-survival').textContent = '0% - Intervenção Necessária';
    
    const strDiv = document.getElementById('final-strengths');
    strDiv.innerHTML = `<strong>Causa Mortis Principal:</strong><p style="font-size:0.85rem; color:var(--text2); margin-top:8px;">${lastExplanation}</p>`;
    
    document.getElementById('final-weaknesses').innerHTML = '<small>Revise os protocolos de manejo e tente novamente.</small>';
    
    switchScreen('screen-final');
}

function showFinal() {
    clearInterval(G.timerRef);
    const surv = Math.round(G.survival);
    saveToRanking(G.score, surv);
    
    // Evolução Visual
    const visualEl = document.getElementById('final-farm-visual');
    if (surv >= 90) visualEl.textContent = '🐄🚜🏡🌾';
    else if (surv >= 70) visualEl.textContent = '🏠🚜🐄';
    else if (surv >= 50) visualEl.textContent = '🏠🌾';
    else visualEl.textContent = '🏚️📉';

    // Textos de Cabeçalho
    document.getElementById('final-title').textContent = surv >= 80 ? '🏆 Safra Concluída!' : '📚 Temporada Finalizada';
    const perfis = {leigo: 'Produtor/Iniciante', estudante: 'Estudante (Técnico)', veterinario: 'Médico Veterinário'};
    document.getElementById('final-profile').textContent = perfis[G.audience];
    document.getElementById('final-score').textContent = `R$ ${G.money} (${G.score} pts)`;
    
    const survColor = surv >= 70 ? 'var(--green2)' : (surv >= 40 ? 'var(--amber)' : 'var(--red)');
    const survEl = document.getElementById('final-survival');
    survEl.textContent = `${surv}%`;
    survEl.style.color = survColor;

    // Processamento de Tags (Forças e Fraquezas)
    const strDiv = document.getElementById('final-strengths');
    const wkDiv = document.getElementById('final-weaknesses');
    strDiv.innerHTML = ''; wkDiv.innerHTML = '';
    
    let weakTags = [];
    let hasStr = false;

    // Calcula os domínios
    for (let tag in G.stats.hitsByTag) {
        if (G.stats.hitsByTag[tag] > (G.stats.missesByTag[tag] || 0)) {
            strDiv.innerHTML += `<span class="tag-item">${tag}</span>`; hasStr = true;
        }
    }
    // Calcula as fraquezas
    for (let tag in G.stats.missesByTag) {
        // Se errou e não acertou mais vezes do que errou
        if (!G.stats.hitsByTag[tag] || G.stats.missesByTag[tag] >= G.stats.hitsByTag[tag]) { 
            wkDiv.innerHTML += `<span class="tag-item">${tag}</span>`; 
            weakTags.push(tag);
        }
    }

    if(!hasStr) strDiv.innerHTML = '<small style="color:var(--text2)">Nenhum domínio consolidado.</small>';
    if(weakTags.length === 0) wkDiv.innerHTML = '<small style="color:var(--green2)">Excelente! Sem falhas mapeadas.</small>';

    // --- LÓGICA DO TUTOR INTELIGENTE ---
    generateTutorAnalysis(surv, weakTags);

    switchScreen('screen-final');
}

function generateTutorAnalysis(survival, weakTags) {
    const msgEl = document.getElementById('tutor-message');
    const recEl = document.getElementById('tutor-recommendations');
    recEl.innerHTML = '';

    // 1. Gera o Feedback Narrativo baseado na Sobrevivência
    if (survival >= 90) {
        msgEl.textContent = `"Excelente trabalho! Você demonstrou uma tomada de decisão clínica precisa e ágil. A fazenda teve perdas mínimas, o que garantiu um alto retorno financeiro e bem-estar animal."`;
    } else if (survival >= 60) {
        msgEl.textContent = `"Uma temporada mediana. Você salvou a maioria do rebanho, mas algumas decisões hesistantes causaram perdas financeiras e de vidas que poderiam ser evitadas com protocolos mais rígidos."`;
    } else {
        msgEl.textContent = `"Tivemos uma temporada crítica. A alta taxa de mortalidade indica que precisamos revisar conceitos urgentes de manejo e fisiologia antes da próxima parição."`;
    }

    // 2. Gera as Recomendações de Estudo baseadas nas Tags Erradas
    if (weakTags.length === 0) {
        recEl.innerHTML = `<li><strong>Parabéns!</strong> Você não apresentou falhas conceituais nesta rodada.</li>
                           <li><strong>Próximo Passo:</strong> Tente jogar escolhendo o nível "Médico Veterinário" para testar conhecimentos avançados e casos clínicos complexos.</li>`;
    } else {
        // Pega até as 3 piores tags para não sobrecarregar o aluno
        const topWeaknesses = weakTags.slice(0, 3);
        
        topWeaknesses.forEach(tag => {
            let recommendation = "";
            // Mini-banco de recomendações dinâmicas
            if (tag.includes('colostro') || tag.includes('ftpi')) recommendation = "Revisar a fisiologia da absorção de imunoglobulinas (IgG) e o tempo de fechamento intestinal (Janela de 24h).";
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

function closeRanking() { switchScreen(G.prevScreen); }

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
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

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