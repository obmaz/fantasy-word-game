// 유사 단어 집합(decoyWordsSet) 수동 관리 파일
// ============================================================
// - 이 파일만 직접 수정해서 유사 단어 집합을 확장하세요.
// - day 개념 없이 "유사한 단어(철자/발음이 비슷한)"를 같은 집합으로 묶습니다.
// - 게임은 객관식(word 보기) 오답 생성 시, 정답 단어가 집합에 있으면
//   같은 집합의 다른 단어들을 우선적으로 오답 후보로 사용합니다.
// - 집합에 매핑이 없거나 후보가 부족하면 rawData에서 랜덤으로 보충합니다.
// ============================================================

(function () {
    if (typeof window === 'undefined') return;

    window.decoyWordsSet = [
        ['miserable', 'stable', 'table', 'capable'],
        ['actual', 'casual', 'visual', 'annual'],
        ['addition', 'audition', 'condition', 'edition', 'tradition', 'traditional', 'ambition'],
        ['all the time', 'anytime', 'sometime', 'overtime'],
        ['angel', 'single', 'triangle', 'jungle'],
        ['article', 'artificial', 'artisan', 'artistic'],
        ['article', 'particle', 'particular', 'partially'],
        ['avail', 'available', 'unveil', 'prevail'],
        ['blank', 'blink', 'plank', 'black'],
        ['be stuck in', 'stick', 'stack', 'stock'],
        ['belief', 'brief', 'relief', 'believe'],
        ['brilliant', 'million', 'trillion', 'resilient'],
        ['foil', 'soil', 'spoil', 'boil'],
        ['brain', 'drain', 'grain', 'train'],
        ['brick', 'bridge', 'trick', 'track'],
        ['claim', 'clamp', 'climb', 'exclaim'],
        ['channel', 'compel', 'panel', 'tunnel'],
        ['candle', 'handle', 'saddle', 'bundle'],
        ['capital', 'captain', 'caption', 'capture'],
        ['cell', 'hell', 'shell', 'spell'],
        ['chain', 'drain', 'grain', 'stain'],
        ['challenging', 'channel', 'change', 'charge'],
        ['campaign', 'champagne', 'champion', 'companion'],
        ['chemical', 'clinic', 'comic', 'cosmic', 'chronicle'],
        ['cycle', 'recycle', 'bicycle', 'circle'],
        ['citizen', 'city', 'civilian', 'civilization'],
        ['cause', 'classic', 'clause', 'course'],
        ['climb', 'climbing', 'slim', 'limb'],
        ['clause', 'closest', 'closet', 'clothes', 'closure'],
        ['cone', 'corn', 'zone', 'bone'],
        ['collar', 'colonel', 'color', 'dollar'],
        ['bomb', 'comb', 'tomb', 'lamb'],
        ['comfort', 'comfortable', 'comforting', 'conform', 'effort'],
        ['command', 'commune', 'communication', 'community', 'comment'],
        ['compare', 'competition', 'complete', 'complex', 'comply'],
        ['campaign', 'complain', 'contain', 'fountain', 'mountain'],
        ['addition', 'ambition', 'condition', 'petition', 'audition'],
        ['congratulate', 'congratulation', 'constitute', 'contribute', 'attribute'],
        ['conservation', 'conversation', 'observation', 'reservation', 'preservation'],
        ['construction', 'destruction', 'restriction', 'instruction'],
        ['certain', 'contain', 'curtain', 'captain', 'mountain'],
        ['cancel', 'conceal', 'council', 'counsel', 'councilor'],
        ['cymbal', 'sample', 'symbol', 'simple'],
        ['deaf', 'deal', 'meal', 'leaf'],
        ['demand', 'depend', 'tend', 'command', 'expand'],
        ['description', 'inscription', 'prescription', 'subscription', 'transcription'],
        ['assign', 'design', 'resign', 'sign', 'signal'],
        ['curtail', 'detail', 'retail', 'tail', 'entail'],
        ['diligent', 'elegant', 'indigent', 'negligent', 'intelligent'],
        ['device', 'divide', 'dividend', 'advice', 'devise'],
        ['doable', 'double', 'bubble', 'trouble'],
        ['download', 'downward', 'shower', 'tower', 'power'],
        ['desert', 'exact', 'except', 'excerpt', 'exist', 'exert'],
        ['exalt', 'exam', 'example', 'exempt', 'exhale', 'exhaust'],
        ['external', 'extra', 'extreme', 'extend'],
        ['fan', 'pan', 'van', 'ban'],
        ['firm', 'foam', 'form', 'frame', 'farm'],
        ['bit', 'fit', 'hit', 'kit', 'sit', 'pit', 'wit'],
        ['flag', 'flap', 'flare', 'flask', 'flat', 'flash'],
        ['boredom', 'freedom', 'kingdom', 'seldom', 'wisdom'],
        ['game', 'gain', 'grain', 'pain', 'rain', 'ruin'],
        ['gene', 'general', 'genius', 'genuine', 'gender'],
        ['habit', 'habitat', 'hibit', 'rehabit'],
        ['hammer', 'harness', 'harvest', 'hardly'],
        ['iceland', 'ireland', 'island', 'inland'],
        ['ideal', 'idiom', 'idiot', 'idle', 'idol'],
        ['global', 'legal', 'illegal', 'logical', 'loyal', 'local'],
        ['convention', 'infection', 'intervention', 'invention', 'intention'],
        ['clever', 'lever', 'level', 'never'],
        ['local', 'loyal', 'vocal', 'royal'],
        ['logic', 'magic', 'topic', 'tragic', 'comic'],
        ['machine', 'machinery', 'magazine', 'mechanic', 'mechanism'],
        ['maid', 'mail', 'main', 'maintain', 'man'],
        ['mention', 'mission', 'motion', 'mansion', 'pension'],
        ['manner', 'material', 'maternal', 'matter', 'mature', 'master'],
        ['medical', 'mental', 'metal', 'modal', 'model', 'medal'],
        ['middle', 'needle', 'puddle', 'riddle', 'saddle'],
        ['maximum', 'minimum', 'medium', 'museum', 'premium'],
        ['mutual', 'natural', 'neutral', 'virtual', 'ritual'],
        ['naval', 'navel', 'novel', 'novelty'],
        ['onion', 'opinion', 'option', 'union'],
        ['organic', 'organize', 'origin', 'original', 'organism'],
        ['male', 'pale', 'peel', 'pile', 'pill', 'pool', 'pull', 'pole'],
        ['people', 'pupil', 'purple', 'purpose', 'purse'],
        ['pain', 'plain', 'plan', 'plane', 'plant', 'plate'],
        ['dot', 'pot', 'lot', 'not', 'hot'],
        ['poison', 'prison', 'reason', 'treason', 'person'],
        ['roll', 'rule', 'toll', 'role'],
        ['ladder', 'saddle', 'sudden', 'sadden', 'slider'],
        ['escape', 'scare', 'scene', 'schedule', 'scheme', 'scholar', 'school'],
        ['scream', 'screen', 'screw', 'stream', 'stress', 'treat'],
        ['function', 'section', 'selection', 'session', 'suction', 'fraction'],
        ['seed', 'seek', 'seem', 'seen', 'teen', 'feed'],
        ['several', 'severe', 'sewer', 'sever'],
        ['shell', 'skill', 'skull', 'still', 'shelf', 'shall'],
        ['small', 'smell', 'stall', 'swell'],
        ['come', 'dome', 'sum', 'some', 'home'],
        ['stable', 'state', 'station', 'statue', 'status', 'statute'],
        ['stale', 'steal', 'steel', 'still', 'stall'],
        ['terrain', 'terrible', 'terrific', 'terror', 'territory'],
        ['tariff', 'traffic', 'terrific', 'terrible'],
        ['track', 'tract', 'trick', 'trace', 'truck'],
        ['twice', 'twig', 'twin', 'twist', 'twice'],
        ['ritual', 'virtual', 'virtue', 'visual', 'vital'],
        ['visible', 'vision', 'visit', 'visitor', 'visual', 'audible'],
        ['kind', 'mind', 'bind', 'find', 'wind', 'wine', 'behind'],
        ['academic', 'academy', 'accent', 'accept', 'access', 'accident', 'account'],
        ['capsule', 'castle', 'casual', 'cattle', 'usual', 'visual'],
        ['caution', 'cousin', 'cuisine', 'curtain', 'cushion', 'caption'],
        ['concession', 'obsession', 'procession', 'recession', 'confession'],
        ['enough', 'rough', 'tough', 'laugh', 'cough'],
        ['achieve', 'active', 'arrive', 'archive', 'alive'],
        ['able', 'alike', 'alive', 'unlike', 'uncle'],
        ['allow', 'ball', 'call', 'follow', 'hollow'],
        ['amount', 'count', 'court', 'mount', 'account'],
        ['analyze', 'angle', 'ankle', 'paralyze', 'uncle'],
        ['arrest', 'artist', 'assist', 'resist'],
        ['barely', 'rarely', 'early', 'hardly', 'fairly'],
        ['be famous for', 'be good for', 'be late for', 'be ready for'],
        ['net', 'vet', 'yet', 'pet', 'set'],
        ['blood', 'flood', 'floor', 'brood', 'food'],
        ['breath', 'breathe', 'breadth', 'replace'],
        ['bullet', 'bulletin', 'ballet', 'wallet'],
        ['back', 'black', 'pack', 'sack', 'rack'],
        ['bar', 'bark', 'bare', 'barn', 'bear'],
        ['cash', 'cast', 'east', 'past', 'vast', 'fast'],
        ['chart', 'chat', 'cheat', 'threat', 'treat'],
        ['collect', 'college', 'correct', 'connect', 'select'],
        ['conduct', 'consult', 'consume', 'convert', 'concert'],
        ['create', 'creature', 'feature', 'treasure', 'measure'],
        ['circus', 'curious', 'various', 'vicious', 'conscious'],
        ['coil', 'coal', 'cool', 'curl', 'curly'],
        ['damage', 'image', 'manage', 'manager', 'massage'],
        ['decrease', 'disease', 'increase', 'increase', 'release'],
        ['degree', 'regret', 'decree', 'agree'],
        ['elder', 'tender', 'thunder', 'render', 'under'],
        ['enter', 'entry', 'entire', 'entity'],
        ['event', 'invent', 'accent', 'intent', 'prevent'],
        ['evolve', 'involve', 'revolve', 'solve', 'resolve'],
        ['excite', 'exult', 'exert', 'exit', 'exile'],
        ['factor', 'factual', 'favor', 'fever', 'flavor'],
        ['fail', 'fall', 'feel', 'fill', 'full'],
        ['fate', 'feather', 'gather', 'weather', 'leather'],
        ['figure', 'ignore', 'nature', 'secure', 'future'],
        ['danger', 'filter', 'finger', 'hunger', 'anger'],
        ['core', 'force', 'sore', 'source', 'resource'],
        ['crash', 'flash', 'fresh', 'flesh', 'trash'],
        ['gallery', 'valley', 'value', 'volley'],
        ['hatch', 'match', 'patch', 'watch', 'batch'],
        ['heal', 'health', 'healthy', 'wealth', 'stealth'],
        ['height', 'weight', 'sight', 'light', 'tight'],
        ['host', 'post', 'ghost', 'most', 'cost'],
        ['report', 'resort', 'result', 'export', 'import'],
        ['import', 'important', 'importance', 'imply', 'improve'],
        ['insect', 'insert', 'inspect', 'aspect', 'expect'],
        ['law', 'raw', 'row', 'low', 'claw'],
        ['latter', 'letter', 'later', 'layer', 'lower'],
        ['dead', 'lead', 'leaf', 'leap', 'load', 'bead'],
        ['lid', 'lip', 'lie', 'rim', 'hip'],
        ['likely', 'lonely', 'lovely', 'lively'],
        ['marry', 'merry', 'cherry', 'berry', 'vary'],
        ['class', 'glass', 'grass', 'mass', 'brass'],
        ['believe', 'relieve', 'receive', 'deceive'],
        ['noble', 'noise', 'noisy', 'notice', 'novel'],
        ['suffer', 'support', 'suppose', 'supply'],
        ['pollution', 'position', 'solution', 'evolution', 'revolution'],
        ['polar', 'solar', 'pour', 'sour', 'tour'],
        ['access', 'excess', 'process', 'progress', 'success'],
        ['produce', 'product', 'protect', 'reduce', 'provide'],
        ['public', 'publish', 'practice', 'practical'],
        ['receipt', 'receive', 'recipe', 'deceive', 'conceive'],
        ['shade', 'shake', 'shame', 'share', 'shape'],
        ['shore', 'store', 'score', 'chore'],
        ['social', 'special', 'species', 'specific'],
        ['stage', 'strange', 'stranger', 'storage'],
        ['strip', 'stripe', 'strap', 'step'],
        ['succeed', 'success', 'successful', 'successive', 'succession'],
        ['take a look', 'take a walk', 'take a rest', 'take a nap'],
        ['actually', 'equally', 'quality', 'quantity', 'totally'],
        ['address', 'express', 'impress', 'excess', 'depress'],
        ['advance', 'advantage', 'adventure', 'advertise'],
        ['affect', 'effect', 'perfect', 'defect', 'infect'],
        ['although', 'through', 'thorough', 'thought'],
        ['amusement', 'agreement', 'movement', 'moment'],
        ['argument', 'document', 'monument', 'instrument'],
        ['banner', 'manner', 'partner', 'partner'],
        ['behave', 'behavior', 'slave', 'brave', 'shave'],
        ['bend', 'lend', 'mend', 'send', 'tend', 'bond'],
        ['award', 'reward', 'board', 'guard'],
        ['bitter', 'butter', 'better', 'batter'],
        ['cave', 'cage', 'case', 'wave', 'gave'],
        ['celebrate', 'collaborate', 'concentrate', 'accelerate'],
        ['check', 'clerk', 'deck', 'neck', 'peck'],
        ['confident', 'confidential', 'president', 'resident'],
        ['crowd', 'cloud', 'proud', 'shroud'],
        ['damp', 'lamp', 'camp', 'stamp', 'ramp'],
        ['environment', 'environmental', 'experiment', 'entertainment'],
        ['freeze', 'freezing', 'breeze', 'sneeze', 'squeeze'],
        ['garbage', 'marriage', 'package', 'passage', 'luggage', 'baggage'],
        ['finally', 'finely', 'finishing', 'final'],
        ['information', 'instruction', 'invitation', 'foundation', 'citation'],
        ['annual', 'manual', 'animal', 'visual'],
        ['legal', 'lethal', 'league', 'loyal'],
        ['horror', 'error', 'mirror', 'terror'],
        ['novel', 'novelty', 'noble', 'notable'],
        ['coin', 'join', 'joint', 'point'],
        ['pair', 'fair', 'hair', 'stair', 'chair'],
        ['popular', 'regular', 'particular', 'similar'],
        ['strike', 'stripe', 'stroke', 'stride', 'string'],
        ['theory', 'theater', 'therapy', 'theory'],
        ['tip', 'tap', 'top', 'type'],
        ['capable', 'valuable', 'stable', 'suitable'],
        ['display', 'misplay', 'replay', 'delay'], // 형태 유사/라임
        ['wing', 'ring', 'king', 'swing'], // 라임
        ['pure', 'poor', 'cure', 'sure'], // 발음 유사/라임
        ['sharp', 'shark', 'harp', 'shape'], // 철자/발음 유사
        ['at first', 'at last', 'at least', 'at best'], // 전치사구 변형
        ['put on', 'put in', 'put off', 'hold on'], // 이어동사 변형
        ['search', 'perch', 'march', 'church'], // 라임
        ['at last', 'at least', 'at first', 'at best'], // 전치사구 변형
        ['piece', 'peace', 'pace', 'price'], // 동음이의어/철자 유사
        ['oven', 'even', 'open', 'often'], // 철자/발음 유사
        ['fix', 'mix', 'six', 'fox'], // 라임/철자 유사
        ['useful', 'youthful', 'use', 'usual'], // 발음 유사
        ['neighbor', 'labor', 'favor', 'nature'], // 발음 유사
        ['war', 'raw', 'wear', 'warm'], // 철자/발음 유사
        ['bury', 'berry', 'very', 'hurry'], // 동음이의어/라임
        ['grow up', 'blow up', 'show up', 'throw up'], // 이어동사 라임
        ['copy', 'coffee', 'puppy', 'happy'], // 발음 유사(한국어 화자 기준)
        ['contest', 'context', 'content', 'concert'], // 철자/발음 혼동
        ['borrow', 'sorrow', 'hollow', 'follow'], // 라임
        ['be in trouble', 'be in touch', 'be in time', 'be in tune'], // 구문 변형
        ['leader', 'reader', 'ladder', 'liter'], // 발음 유사/혼동
        ['prize', 'price', 'pride', 'prise'], // 발음 유사
        ['sleepy', 'sleeping', 'slippery', 'sweepy'], // 형태/발음 유사
        ['lift', 'gift', 'left', 'list'], // 라임/철자 유사
        ['root', 'route', 'roof', 'boot'], // 발음 유사/라임
        ['wonder', 'wander', 'under', 'thunder'], // 철자 혼동/라임
        ['mix', 'fix', 'miss', 'max'], // 라임/철자 유사
        ['coach', 'couch', 'catch', 'poach'], // 발음 혼동/라임
        ['cartoon', 'carton', 'canton', 'cocoon'], // 철자/발음 유사
        ['view', 'few', 'new', 'due'], // 라임
        ['nickname', 'name', 'pick name', 'big name'], // 포함 단어 활용
        ['dig', 'big', 'pig', 'dog'], // 라임/철자 유사
        ['find out', 'bind out', 'hide out', 'find in'], // 라임/구문 변형
        ['total', 'turtle', 'title', 'metal'], // 발음 유사
        ['think up', 'drink up', 'link up', 'pick up'], // 라임
        ['among', 'along', 'amount', 'alone'], // 철자/발음 유사
        ['harmony', 'money', 'honey', 'balcony'], // 라임
        ['shout', 'shoot', 'shut', 'scout'], // 철자/발음 유사
        ['smart', 'start', 'smell', 'small'], // 철자/라임
        ['hang', 'bang', 'sang', 'hand'], // 라임/철자 유사
        ['bored', 'board', 'bold', 'bird'], // 동음이의어/발음 유사
        ['care', 'car', 'dare', 'cure'], // 철자/라임
        ['hero', 'zero', 'hear', 'here'], // 라임/발음 유사
        ['planet', 'plant', 'plane', 'plate'], // 철자 유사
        ['teenager', 'manager', 'villager', 'stranger'], // 접미사 라임
        ['uniform', 'form', 'unicorn', 'inform'], // 형태 유사
        ['beauty', 'duty', 'booty', 'beast'], // 라임/철자 유사
        ['because of', 'in case of', 'become of', 'consist of'], // 구문 변형
        ['female', 'male', 'email', 'tamale'], // 포함 단어/라임
        ['without', 'with', 'about', 'workout'], // 포함 단어/라임
        ['miss', 'kiss', 'mess', 'hiss'], // 라임/철자 유사
        ['sunlight', 'moonlight', 'starlight', 'searchlight'], // 복합어 패턴
        ['language', 'luggage', 'bandage', 'sausage'], // 발음/철자 유사
        ['dive', 'drive', 'hive', 'live'], // 철자/라임
        ['alarm', 'arm', 'farm', 'harm'], // 포함 단어/라임
        ['calm down', 'come down', 'cool down', 'sit down'], // 이어동사 유사
        ['chance', 'change', 'dance', 'glance'], // 철자/라임
        ['nobody', 'somebody', 'anybody', 'no one'], // 의미/형태 대립
        ['before long', 'before noon', 'so long', 'too long'], // 구문 변형
        ['taste', 'test', 'toast', 'paste'], // 발음/철자 유사
        ['take care', 'take share', 'take air', 'take dare'], // 라임
        ['regularly', 'singular', 'popular', 'secular'], // 어미 라임
        ['silent', 'island', 'violent', 'talent'], // 철자/발음 유사
        ['rub', 'rob', 'tub', 'pub'], // 철자/라임
        ['neat', 'meat', 'heat', 'seat'], // 라임
        ['weigh', 'way', 'weight', 'whey'], // 동음/철자
        ['be different from', 'be difficult for', 'be distant from', 'be indifferent to'], // 구문 유사
        ['fill in', 'fill out', 'fall in', 'fit in'], // 이어동사 변형
        ['take out', 'take off', 'make out', 'fade out'], // 이어동사 변형
        ['guide', 'glide', 'guard', 'pride'], // 철자/발음 유사
        ['during', 'boring', 'curing', 'luring'], // 라임
        ['mistake', 'miss take', 'steak', 'lake'], // 발음 유사
        ['tire', 'fire', 'wire', 'tear'], // 라임
        ['flour', 'floor', 'flower', 'sour'], // 동음/라임
        ['lawyer', 'liar', 'lower', 'layer'], // 발음 유사
        ['ache', 'lake', 'bake', 'cake'], // 라임
        ['prepare', 'repair', 'compare', 'spare'], // 라임/철자
        ['soldier', 'shoulder', 'folder', 'holder'], // 발음/라임
        ['quite', 'quiet', 'quit', 'white'], // 철자 혼동
        ['patient', 'patent', 'parent', 'ancient'], // 철자/발음 유사
        ['spicy', 'spy', 'icy', 'space'], // 포함 단어/철자
        ['get out of', 'run out of', 'go out of', 'get rid of'], // 구문 변형
        ['elderly', 'early', 'orderly', 'dearly'], // 발음/철자
        ['wild', 'mild', 'wide', 'wind'], // 철자/라임
        ['especially', 'specially', 'essentially', 'officially'], // 부사 라임
        ['make noise', 'make voice', 'make choice', 'make poise'], // 라임
        ['online', 'outline', 'inline', 'offline'], // 형태 유사
        ['help out', 'hold out', 'hang out', 'hear out'], // 이어동사 변형
        ['lost', 'last', 'cost', 'host'], // 라임
        ['blind', 'blond', 'bind', 'mind'], // 철자/라임
        ['culture', 'future', 'nature', 'vulture'], // 라임
        ['suck', 'luck', 'duck', 'sock'], // 라임/철자
        ['item', 'stem', 'system', 'term'], // 포함/발음
        ['pick up', 'pack up', 'kick up', 'stick up'], // 라임
        ['hand in hand', 'arm in arm', 'face to face', 'back to back'], // 숙어 패턴
        ['designer', 'design', 'signer', 'liner'], // 형태 유사
        ['flow', 'slow', 'blow', 'low'], // 라임
        ['tasty', 'testy', 'hasty', 'nasty'], // 라임
        ['soap', 'soup', 'soak', 'soft'], // 발음/철자 혼동
        ['rail', 'rain', 'tail', 'nail'], // 철자/라임
        ['someday', 'sunday', 'monday', 'some way'], // 발음 유사
        ['secret', 'sacred', 'cigarette', 'regret'], // 발음/라임
        ['couple', 'double', 'bubble', 'trouble'], // 라임
        ['engineer', 'engine', 'pioneer', 'volunteer'], // 접미사 라임
        ['lady', 'ready', 'lazy', 'baby'], // 라임/철자
        ['rainy', 'brainy', 'train', 'drain'], // 라임/포함
        ['site', 'sight', 'cite', 'bite'], // 동음/라임
        ['funny', 'bunny', 'sunny', 'money'], // 라임
        ['history', 'story', 'mystery', 'factory'], // 포함/라임
        ['stomach', 'match', 'much', 'touch'], // 발음 유사
        ['exciting', 'exiting', 'reciting', 'inviting'], // 철자 혼동/라임
        ['area', 'era', 'idea', 'korea'], // 발음/라임
        ['dial', 'deal', 'dual', 'trial'], // 철자/라임
        ['look up', 'look at', 'look for', 'cook up'], // 이어동사 변형
        ['subway', 'highway', 'runway', 'way'], // 형태 유사
        ['dangerous', 'generous', 'danger', 'angel'], // 철자/발음
        ['bookstore', 'book', 'store', 'restore'], // 포함/형태
        ['happen', 'happy', 'open', 'deepen'], // 철자/라임
        ['hometown', 'downtown', 'home', 'town'], // 형태 유사
        ['program', 'grammar', 'kilogram', 'diagram'], // 철자/라임
        ['search for', 'reach for', 'march for', 'search in'], // 라임
        ['a few', 'a little', 'a lot', 'a view'], // 구문/라임
        ['dish', 'fish', 'dash', 'wish'], // 라임/철자
        ['swallow', 'hollow', 'follow', 'shallow'], // 라임
        ['success', 'access', 'process', 'excess'], // 철자/라임
        ['waste', 'waist', 'taste', 'paste'], // 동음/라임
        ['grade', 'trade', 'blade', 'shade'], // 라임
        ['pop', 'top', 'hop', 'cop'], // 라임
        ['not at all', 'not at home', 'not a bit', 'not a lot'], // 구문 변형
        ['turn off', 'turn on', 'burn off', 'run off'], // 이어동사 변형
        ['invite', 'invent', 'invest', 'inside'], // 철자 혼동
        ['space', 'pace', 'spice', 'place'], // 포함/철자
        ['market', 'mark', 'target', 'jacket'], // 포함/라임
        ['be full of', 'be fond of', 'be free of', 'be full up'], // 구문 변형
        ['wait for', 'wait on', 'ask for', 'pay for'], // 구문 변형
        ['diary', 'dairy', 'dial', 'daily'], // 철자 혼동
        ['list', 'least', 'last', 'mist'], // 철자/라임
        ['ocean', 'motion', 'lotion', 'option'], // 발음/라임
        ['pressure', 'treasure', 'measure', 'pleasure'], // 라임
        ['energy', 'enemy', 'allergy', 'synergy'], // 발음/라임
        ['introduce', 'produce', 'reduce', 'induce'], // 어근/라임
        ['realize', 'real', 'size', 'resize'], // 포함/형태
        ['challenge', 'change', 'range', 'orange'], // 철자/라임
        ['shop', 'ship', 'shape', 'chop'], // 철자/발음
        ['shake hands', 'take hands', 'shake heads', 'shake bands'], // 구문 변형
        ['scared', 'sacred', 'scored', 'scarred'], // 철자 혼동
        ['balance', 'ambulance', 'glance', 'dance'], // 발음/라임
        ['lose', 'loose', 'lost', 'rose'], // 철자/라임
        ['judge', 'fudge', 'bridge', 'edge'], // 라임
        ['peace', 'piece', 'pace', 'peas'], // 동음/철자
        ['huge', 'hug', 'page', 'cage'], // 철자/라임
        ['be covered with', 'be crowded with', 'be filled with', 'be covered in'], // 구문 변형
        ['write down', 'sit down', 'calm down', 'write on'], // 이어동사 변형
        ['customer', 'costume', 'custom', 'consumer'], // 철자/의미 혼동
        ['adult', 'add', 'result', 'insult'], // 발음/라임
        ['interview', 'review', 'preview', 'view'], // 어근/라임
        ['village', 'villa', 'age', 'pill'], // 포함/철자
        ['excuse', 'refuse', 'confuse', 'use'], // 라임
        ['husband', 'band', 'hand', 'sand'], // 포함 단어/라임
        ['stand', 'sand', 'band', 'land'], // 라임
        ['careful', 'fearful', 'tearful', 'care'], // 라임/어근
        ['field', 'yield', 'shield', 'filled'], // 라임/발음 유사
        ['half', 'calf', 'laugh', 'safe'], // 라임/철자
        ['be good at', 'be bad at', 'be good to', 'be poor at'], // 반의어/구문 변형
        ['look for', 'look at', 'cook for', 'book for'], // 구문 변형/라임
        ['promise', 'miss', 'premise', 'compromise'], // 포함/철자 유사
        ['spread', 'bread', 'read', 'speed'], // 라임/철자
        ['suddenly', 'sudden', 'sadly', 'sunny'], // 형태 유사
        ['focus', 'locus', 'hocus', 'force'], // 라임/철자 유사
        ['whole', 'hole', 'whale', 'while'], // 동음/철자 유사
        ['hunter', 'hunt', 'haunt', 'winter'], // 어근/라임
        ['label', 'table', 'cable', 'level'], // 라임/철자
        ['a lot of', 'a bit of', 'a pot of', 'a lot off'], // 구문 변형/라임
        ['pay for', 'play for', 'pray for', 'say for'], // 라임
        ['audience', 'audio', 'dance', 'absence'], // 어근/철자 유사
        ['sense', 'fence', 'tense', 'dense'], // 라임
        ['exercise', 'size', 'excite', 'wise'], // 포함/형태 유사
        ['army', 'arm', 'harm', 'alarm'], // 포함/라임
        ['ride', 'hide', 'wide', 'side'], // 라임
        ['art', 'part', 'cart', 'start'], // 라임
        ['turn on', 'turn off', 'burn on', 'put on'], // 이어동사 변형
        ['come back', 'go back', 'come black', 'come pack'], // 구문 변형/라임
        ['party', 'part', 'park', 'pity'], // 형태/발음 유사
        ['buy', 'by', 'bye', 'guy'], // 동음/라임
        ['beat', 'bit', 'bat', 'bet'], // 모음 변화
        ['advise', 'advice', 'device', 'revise'], // 품사 혼동/라임
        ['place', 'palace', 'pace', 'plate'], // 철자/발음 유사
        ['date', 'gate', 'late', 'mate'], // 라임
        ['hurt', 'heart', 'hut', 'hunt'], // 발음/철자 유사
        ['decide', 'side', 'beside', 'divide'], // 어근/라임
        ['park', 'dark', 'bark', 'spark'], // 라임
        ['cross', 'across', 'boss', 'loss'], // 형태/라임
        ['music', 'muse', 'sick', 'magic'], // 어근/철자 유사
        ['throw away', 'blow away', 'go away', 'run away'], // 구문 변형
        ['chief', 'chef', 'thief', 'brief'], // 철자 혼동/라임
        ['humorous', 'humor', 'rumor', 'numerous'], // 어근/라임
        ['unique', 'antique', 'technique', 'unit'], // 라임/어근
        ['completely', 'complete', 'compete', 'delete'], // 어근/라임
        ['pose', 'rose', 'nose', 'hose'], // 라임
        ['stupid', 'study', 'cupid', 'rapid'], // 형태/라임
        ['race', 'face', 'pace', 'rice'], // 라임/철자
        ['look through', 'look though', 'cook through', 'go through'], // 철자 혼동/구문
        ['modern', 'model', 'mode', 'modest'], // 형태 유사
        ['electricity', 'electric', 'city', 'elastic'], // 어근/철자 유사
        ['striking', 'strike', 'string', 'hiking'], // 어근/라임
        ['include', 'conclude', 'exclude', 'cloud'], // 어근/포함
        ['price', 'prize', 'rice', 'ice'], // 발음/포함
        ['forest', 'rest', 'best', 'frost'], // 포함/라임
        ['bother', 'brother', 'mother', 'border'], // 철자/발음 유사
        ['on time', 'in time', 'on top', 'one time'], // 구문 변형
        ['give up', 'give in', 'live up', 'get up'], // 이어동사 변형
        ['depend on', 'spend on', 'depend in', 'defend on'], // 라임/구문
        ['private', 'pirate', 'pride', 'pivot'], // 철자/발음 유사
        ['disappear', 'appear', 'pear', 'spear'], // 어근/포함
        ['foreigner', 'foreign', 'rain', 'reign'], // 어근/포함
        ['colorful', 'color', 'careful', 'wonderful'], // 어근/접미사
        ['author', 'other', 'auto', 'arthur'], // 발음 유사
        ['helpful', 'help', 'hopeful', 'health'], // 어근/형태 유사
        ['officer', 'office', 'offer', 'coffee'], // 어근/라임
        ['be crowded with', 'be covered with', 'be clouded with', 'be crowned with'], // 철자 유사/라임
        ['at least', 'at last', 'at best', 'at list'], // 구문 변형
        ['abroad', 'broad', 'board', 'aboard'], // 포함/철자 혼동
        ['structure', 'strict', 'picture', 'lecture'], // 발음/라임
        ['aggressive', 'agree', 'progress', 'massive'], // 어근/라임
        ['calm', 'palm', 'balm', 'come'], // 라임/발음 유사
        ['set up', 'get up', 'sit up', 'set off'], // 이어동사 변형
        ['take part in', 'take part of', 'play part in', 'take art in'], // 구문 변형
        ['make sure', 'make pure', 'take sure', 'make sore'], // 라임
        ['speech', 'peach', 'speed', 'speak'], // 포함/발음 유사
        ['duty', 'beauty', 'dirty', 'due'], // 라임/어근
        ['southern', 'south', 'sudden', 'other'], // 어근/발음 유사
        ['church', 'lurch', 'search', 'birch'], // 라임
        ['contact', 'tact', 'contract', 'compact'], // 포함/철자 유사
        ['wide', 'wild', 'side', 'tide'], // 철자/라임
        ['appear', 'pear', 'spear', 'fear'], // 포함/라임
        ['carry out', 'carry on', 'cry out', 'carry bout'], // 이어동사 변형
        ['lose weight', 'lose wait', 'use weight', 'lose way'], // 동음/구문
        ['pace', 'face', 'race', 'space'], // 라임
        ['cloth', 'clothes', 'close', 'both'], // 발음/철자 혼동
        ['rate', 'late', 'date', 'gate'], // 라임
        ['gorgeous', 'george', 'courage', 'urge'], // 발음/철자 유사
        ['relax', 'tax', 'wax', 'fax'], // 라임
        ['against', 'again', 'gain', 'guest'], // 포함/철자 유사
        ['unfair', 'fair', 'affair', 'hair'], // 어근/라임
        ['prove', 'move', 'love', 'proof'], // 라임/품사 변화
        ['footprint', 'foot', 'print', 'point'], // 어근 분리
        ['loudly', 'loud', 'cloud', 'proudly'], // 어근/라임
        ['seafood', 'sea', 'food', 'see food'], // 어근 분리/동음
        ['stop by', 'drop by', 'stop buy', 'step by'], // 구문/동음
        ['be over', 'be cover', 'be ever', 'go over'], // 철자/구문
        ['major', 'mayor', 'maker', 'jar'], // 발음/철자 유사
        ['observe', 'serve', 'reserve', 'deserve'], // 어근/라임
        ['character', 'actor', 'tractor', 'factor'], // 라임/철자 유사
        ['method', 'metal', 'meter', 'methyl'], // 발음/철자 유사
        ['offer', 'off', 'coffee', 'suffer'], // 포함/라임
        ['recently', 'recent', 'decently', 'gently'], // 어근/라임
        ['limit', 'rim', 'bit', 'emit'], // 포함/라임
        ['system', 'stem', 'sister', 'item'], // 철자/형태 유사
        ['make sense', 'make fence', 'make tense', 'take sense'], // 라임
        ['staff', 'stuff', 'stiff', 'stay'], // 모음 변화/철자
        ['suggest', 'guest', 'digest', 'congest']['relate'], // 포함/라임
        ['relate', 'late', 'rate', 'debate'], // 라임/포함
        ['used to', 'use to', 'used two', 'useful'], // 발음 혼동/형태
        ['loss', 'lost', 'boss', 'toss'], // 철자/라임
        ['occur', 'cure', 'recur', 'incur'], // 포함/라임
        ['policy', 'police', 'polish', 'polite'], // 철자/발음 유사
        ['physical', 'physics', 'physician', 'musical'], // 어근/라임
        ['discuss', 'cuss', 'disgust', 'disk'], // 포함/발음 유사
        ['standard', 'stand', 'hard', 'sand'], // 포함/라임
        ['remain', 'main', 'rain', 'retain'], // 포함/라임
        ['figure out', 'find out', 'figure in', 'dig out'], // 구문/철자 유사
        ['focus on', 'focus in', 'count on', 'go on'], // 구문 변형
        ['survive', 'revive', 'alive', 'service'], // 라임/철자 유사
        ['ancient', 'accent', 'agent', 'patient'], // 발음/철자 유사
        ['benefit', 'fit', 'beneath', 'profit'], // 포함/라임
        ['concern', 'concert', 'corn', 'certain'], // 철자/발음 유사
        ['term', 'turn', 'team', 'germ'], // 발음/라임
        ['result in', 'result from', 'consult in', 'insult'], // 반의어/라임
        ['run out of', 'run out', 'get out of', 'run into'], // 구문 변형
        ['industry', 'dust', 'dusty', 'industrial'], // 포함/형태
        ['prefer', 'refer', 'defer', 'infer'], // 라임/어근
        ['perform', 'form', 'reform', 'perfume'], // 어근/철자 유사
        ['encourage', 'courage', 'discourage', 'engage'], // 어근/반의어
        ['pay attention', 'pay mention', 'call attention', 'pay pension'], // 발음/구문
        ['apart', 'part', 'depart', 'a part'], // 포함/라임
        ['poetry', 'poet', 'pottery', 'poultry'], // 어근/철자 혼동
        ['weekday', 'weekend', 'weak day', 'weekly'], // 형태/발음 혼동
        ['fear', 'ear', 'hear', 'tear'], // 포함/라임
        ['recent', 'resent', 'decent', 'scent'], // 발음/라임
        ['injury', 'jury', 'injure', 'fury'], // 포함/라임
        ['haircut', 'hair', 'cut', 'shortcut'], // 포함/형태
        ['fill out', 'fill in', 'fall out', 'chill out'], // 반의어/라임
        ['more than', 'more then', 'less than', 'better than'], // 발음/반의어
        ['cancer', 'cancel', 'dancer', 'answer'], // 철자/라임
        ['fold', 'hold', 'cold', 'told'], // 라임
        ['downtown', 'down', 'town', 'uptown'], // 어근 분리/반의어
        ['crime', 'cream', 'prime', 'climb'], // 발음/라임
        ['surface', 'face', 'surplus', 'ace'], // 포함/형태
        ['entrance', 'enter', 'entry', 'trance'], // 어근/라임
        ['respect', 'inspect', 'aspect', 'suspect'], // 어근/라임
        ['universe', 'verse', 'university', 'reverse'], // 포함/형태
        ['safety', 'safe', 'save', 'safely'], // 어근/품사
        ['asleep', 'sleep', 'sheep', 'steep'], // 어근/라임
        ['wavy', 'wave', 'way', 'navy'], // 어근/라임
        ['edge', 'age', 'hedge', 'wedge'], // 라임
        ['dust', 'dusk', 'just', 'must'], // 발음/라임
        ['obvious', 'previous', 'envious', 'various'], // 접미사 라임
        ['fabric', 'brick', 'public', 'factory'], // 포함/형태
        ['sink', 'think', 'link', 'pink'], // 발음/라임
        ['slip', 'sleep', 'slap', 'lip'], // 장단음/라임
        ['career', 'carrier', 'care', 'car'], // 발음/포함
        ['relative', 'relate', 'relation', 'creative'], // 어근/라임
        ['percentage', 'percent', 'age', 'advantage'], // 어근/라임
        ['reply', 'play', 'rely', 'apply'], // 포함/라임
        ['awful', 'awe', 'full', 'lawful'], // 어근/라임
        ['overcome', 'come over', 'become', 'welcome'], // 구문/형태
        ['furniture', 'future', 'nature', 'fur'], // 철자/포함
        ['parade', 'paradise', 'grade', 'trade'], // 형태/라임
        ['harm', 'farm', 'arm', 'warm'], // 라임
        ['gesture', 'guest', 'guess', 'vesture'], // 발음/라임
        ['locker', 'lock', 'rocker', 'looker'], // 어근/라임
        ['remember', 'member', 'ember', 'december'], // 포함/라임
        ['curiosity', 'curious', 'city', 'cure'], // 어근/포함
        ['athlete', 'athletic', 'let', 'feat'], // 어근/라임
        ['such', 'much', 'touch', 'search'], // 라임/철자
        ['electric', 'trick', 'election', 'elastic'], // 포함/철자 유사
        ['booth', 'boot', 'both', 'tooth'], // 포함/라임
        ['fault', 'salt', 'vault', 'default'], // 라임
        ['difference', 'differ', 'reference', 'defense'], // 어근/라임
        ['link', 'sink', 'pink', 'ink'], // 라임/포함
        ['media', 'medal', 'idea', 'medium'], // 철자/발음
        ['bold', 'bald', 'old', 'cold'], // 발음/라임
        ['diet', 'die', 'quiet', 'duet'], // 포함/라임
        ['explore', 'explode', 'implore', 'ignore'], // 형태/라임
        ['represent', 'present', 'resent', 'president'], // 포함/형태
        ['gap', 'cap', 'map', 'lap'], // 라임
        ['necessary', 'necessity', 'essay', 'access'], // 어근/발음
        ['nervous', 'nerve', 'never', 'various'], // 어근/철자
        ['young', 'tongue', 'lung', 'your'], // 라임/철자
        ['ease', 'easy', 'east', 'case'], // 어근/라임
        ['average', 'age', 'rage', 'coverage'], // 포함/라임
        ['relationship', 'relation', 'ship', 'shape'], // 어근/포함
        ['pollute', 'polite', 'dilute', 'salute'], // 철자/라임
        ['smoke', 'snake', 'spoke', 'coke'], // 철자/라임
        ['period', 'peer', 'perish', 'pyramid'], // 발음/형태
        ['virus', 'iris', 'minus', 'various'], // 라임/형태
        ['require', 'inquire', 'acquire', 'wire'], // 라임/포함
        ['adapt', 'adopt', 'adept', 'depth'], // 모음 변화/라임
        ['volunteer', 'voluntary', 'steer', 'tear'], // 어근/라임
        ['fame', 'game', 'name', 'same'], // 라임
        ['object', 'subject', 'project', 'reject'], // 라임
        ['former', 'farmer', 'form', 'formal'], // 철자/어근
        ['biology', 'bio', 'logy', 'geology'], // 어근 분리
        ['botany', 'boat', 'any', 'button'], // 발음/철자
        ['organ', 'orphan', 'organize', 'origin'], // 철자/어근
        ['nerve', 'serve', 'curve', 'never'], // 라임/철자
        ['skeleton', 'ton', 'skill', 'sketch'], // 포함/발음
        ['muscle', 'mussel', 'bustle', 'uncle'], // 동음/라임
        ['genetic', 'gene', 'generic', 'gentle'], // 어근/형태
        ['blame', 'flame', 'lame', 'claim'], // 라임
        ['scold', 'cold', 'sold', 'hold'], // 포함/라임
        ['compete', 'complete', 'compute', 'pet'], // 철자/포함
        ['positive', 'position', 'possible', 'post'], // 어근/포함
        ['negative', 'native', 'negate', 'relative'], // 철자/라임
        ['issue', 'tissue', 'sue', 'miss you'], // 포함/라임
        ['react', 'act', 're-act', 'fact'], // 포함/라임
        ['respond', 'pond', 'correspond', 'despond'], // 포함/라임
        ['satisfy', 'ratify', 'notify', 'simplify'],
        ['develop', 'envelope', 'devil', 'level'],
        ['repair', 'pair', 'despair', 'prepare'],
        ['cure', 'pure', 'sure', 'lure'],
        ['fuel', 'duel', 'cruel', 'full'],
        ['dislike', 'like', 'unlike', 'disk'],
        ['astronaut', 'astronomy', 'strong', 'knot'],
        ['wisely', 'wise', 'widely', 'nicely'],
        ['width', 'with', 'wild', 'filth'],
        ['depth', 'death', 'debt', 'step'],
        ['length', 'strength', 'lens', 'tenth'],
        ['volume', 'fume', 'value', 'column'],
        ['square', 'spare', 'scare', 'share'],
        ['inform', 'form', 'reform', 'uniform'],
        ['neighborhood', 'neighbor', 'hood', 'childhood'],
        ['earthquake', 'earth', 'quake', 'cake'],
        ['delivery', 'liver', 'very', 'deliver'],
        ['liberty', 'liberal', 'berry', 'city'],
        ['announcer', 'announce', 'ounce', 'bouncer'],
        ['canal', 'channel', 'panel', 'camel'],
        ['make it', 'make out', 'fake it', 'take it'],
        ['strength', 'strange', 'string', 'length'],
        ['compass', 'pass', 'mass', 'encompass'],
        ['heaven', 'heavy', 'leaven', 'seven'],
        ['sign up for', 'sign in for', 'sign up to', 'line up for'],
        ['bless', 'less', 'mess', 'dress'],
        ['tragedy', 'strategy', 'comedy', 'trade'],
        ['friendship', 'friend', 'ship', 'hardship'],
        ['justice', 'just', 'ice', 'juice'],
        ['give away', 'go away', 'give way', 'give a day'],
        ['such as', 'such a', 'much as', 'such is'],
        ['spray', 'pray', 'ray', 'gray'],
        ['appearance', 'appear', 'spear', 'pear'],
        ['business', 'busy', 'bus', 'ness'],
        ['credit', 'edit', 'debit', 'ready'],
        ['describe', 'scribe', 'tribe', 'prescribe'],
        ['forgive', 'give', 'forget', 'for'],
        ['humble', 'bumble', 'fumble', 'tumble'],
        ['upon', 'on', 'up', 'spoon'],
        ['launch', 'lunch', 'punch', 'bunch'],
        ['photographer', 'photo', 'graph', 'autograph'],
        ['cardboard', 'card', 'board', 'hard'],
        ['supper', 'upper', 'super', 'suffer'],
        ['evidence', 'evident', 'dense', 'fence'],
        ['put up', 'put on', 'set up', 'cut up'],
        ['be related to', 'be late to', 'be rated to', 'be hated to'],
        ['bet', 'bat', 'bit', 'bed'],
        ['script', 'strip', 'trip', 'scrap'],
        ['recommend', 'command', 'commend', 'comment'],
        ['float', 'boat', 'coat', 'flat'],
        ['difficulty', 'difficult', 'cult', 'faculty'],
        ['narrator', 'narrate', 'rate', 'narrow'],
        ['uneasy', 'easy', 'uneaten', 'cheesy'],
        ['route', 'root', 'out', 'rout'],
        ['portrait', 'port', 'trait', 'portray'],
        ['motto', 'lotto', 'auto', 'motor'],
        ['give off', 'give up', 'go off', 'live off'],
        ['work out', 'walk out', 'work on', 'look out'],
        ['expert', 'export', 'expect', 'pert'],
        ['situation', 'station', 'nation', 'citation'],
        ['within', 'with', 'thin', 'win'],
        ['distance', 'stance', 'dance', 'instant'],
        ['individual', 'divide', 'dual', 'visual'],
        ['serve', 'nerve', 'curve', 'swerve'],
        ['generally', 'general', 'rally', 'ally'],
        ['vivid', 'avid', 'covid', 'video'],
        ['rubber', 'rub', 'robber', 'bubble'],
        ['use up', 'use of', 'rise up', 'use it'],
        ['make a decision', 'make a revision', 'take a decision', 'make a division'],
        ['apologize', 'apology', 'size', 'prize'],
        ['spirit', 'spit', 'split', 'pirate'],
        ['since', 'sense', 'mince', 'prince'],
        ['crowded', 'crowd', 'row', 'cloud'],
        ['truly', 'true', 'unruly', 'july'],
        ['disadvantage', 'advantage', 'vintage', 'age'],
        ['independence', 'depend', 'dance', 'pence'],
        ['unexpected', 'expect', 'inspect', 'suspect'],
        ['account for', 'count for', 'account of', 'amount for'],
        ['be about to', 'be able to', 'be out to', 'be bound to'],
        ['opposite', 'oppose', 'site', 'composite'],
        ['disappoint', 'appoint', 'point', 'disappear'],
        ['slightly', 'light', 'sight', 'flight'],
        ['bunch', 'lunch', 'punch', 'crunch'],
        ['communicate', 'community', 'commute', 'common'],
        ['interpret', 'interrupt', 'internet', 'pretend'],
        ['twisted', 'twist', 'wrist', 'mist'],
        ['survey', 'convey', 'purvey', 'surf'],
        ['priest', 'beast', 'feast', 'east'],
        ['most of all', 'best of all', 'most of ill', 'list of all'],
        ['give a hand', 'have a hand', 'give a band', 'give a land'],
        ['knit', 'kit', 'knot', 'hit'],
        ['whenever', 'when', 'ever', 'never'],
        ['graduate', 'grade', 'gradual', 'ate'],
        ['background', 'ground', 'back', 'round'],
        ['personality', 'person', 'personal', 'city'],
        ['decorate', 'rate', 'crate', 'date'],
        ['rhythm', 'rhyme', 'them', 'him'],
        ['in case of', 'in face of', 'in place of', 'in case off'],
        ['on one', 'on own', 'no one', 'on once'],
        ['ashamed', 'shame', 'same', 'named'],
        ['deny', 'rely', 'defy', 'tiny'],
        ['presentation', 'present', 'station', 'nation'],
        ['transfer', 'refer', 'trans', 'fer'],
        ['slight', 'light', 'flight', 'sight'],
        ['well-known', 'well-grown', 'well-blown', 'well-own'],
        ['fantasy', 'fancy', 'fan', 'sea'],
        ['envelope', 'develop', 'slope', 'rope'],
        ['ordinary', 'order', 'dairy', 'diary'],
        ['hold out', 'hold on', 'sold out', 'fold out'],
        ['pass away', 'pass way', 'pass a day', 'cast away'],
        ['edit', 'credit', 'exit', 'eat'],
        ['apply', 'apple', 'ply', 'reply'],
        ['digest', 'guest', 'best', 'chest'],
        ['depressed', 'press', 'dress', 'mess'],
        ['gradually', 'grade', 'dual', 'ally'],
        ['unfortunately', 'fortune', 'tune', 'lately'],
        ['stove', 'store', 'dove', 'cove'],
        ['put together', 'get together', 'sit together', 'put to gather'],
        ['on the other hand', 'on the other land', 'on the other band', 'on the other sand'],
        ['forecast', 'cast', 'last', 'fast'],
        ['awesome', 'some', 'same', 'sum'],
        ['empire', 'fire', 'wire', 'pirate'],
        ['satellite', 'light', 'site', 'tell'],
        ['upset', 'set', 'up', 'setup'],
        ['escalate', 'late', 'escape', 'estate'],
        ['migrate', 'rate', 'grate', 'gate'],
        ['poverty', 'over', 'cover', 'party'],
        ['grocery', 'gross', 'row', 'sorcery'],
        ['studio', 'study', 'radio', 'audio'],
        ['unbelievable', 'believe', 'able', 'table'],
        ['tell A from B', 'tell A for B', 'sell A from B', 'tell A form B'],
        ['proverb', 'verb', 'herb', 'superb'],
        ['billion', 'million', 'lion', 'bill'],
        ['organization', 'organ', 'nation', 'station'],
        ['following', 'follow', 'wing', 'flowing'],
        ['tag', 'bag', 'rag', 'lag'],
        ['responsible', 'response', 'sponge', 'able'],
        ['concrete', 'create', 'street', 'treat'],
        ['servant', 'serve', 'ant', 'van'],
        ['waterproof', 'water', 'proof', 'roof'],
        ['underground', 'ground', 'under', 'round'],
        ['up to', 'up two', 'up too', 'cup to'],
        ['come to mind', 'come to bind', 'come to find', 'some to mind'],
        ['risk', 'disk', 'brisk', 'frisk'],
        ['faucet', 'sauce', 'set', 'fault'],
        ['optimist', 'mist', 'miss', 'list'],
        ['to one', 'to won', 'two one', 'too one'],
        ['suit', 'suite', 'soot', 'fruit'],
        ['mysterious', 'mystery', 'serious', 'stereo'],
        ['consider', 'side', 'inside', 'cider'],
        ['mud', 'mad', 'bud', 'thud'],
        ['sightseeing', 'sight', 'see', 'sea'],
        ['transport', 'port', 'sport', 'passport'],
        ['nest', 'best', 'test', 'rest'],
        ['embarrass', 'bar', 'ass', 'embrace'],
        ['watch over', 'watch cover', 'watch ever', 'match over'],
        ['participate', 'part', 'anticipate', 'pate'],
        ['bring back', 'bring pack', 'ring back', 'bring bag'],
        ['persuade', 'suede', 'wade', 'parade'],
        ['spaceship', 'space', 'ship', 'shape'],
        ['surprisingly', 'surprise', 'rise', 'prize'],
        ['a variety of', 'a society of', 'a variety off', 'a parity of'],
        ['sincere', 'since', 'here', 'severe'],
        ['operator', 'operate', 'rate', 'orator'],
        ['motivate', 'motive', 'ate', 'late'],
        ['hurricane', 'hurry', 'cane', 'rain'],
        ['dew', 'do', 'due', 'few'],
        ['feast', 'beast', 'east', 'least'],
        ['temperature', 'temper', 'nature', 'pure'],
        ['performance', 'perform', 'form', 'dance'],
        ['generation', 'nation', 'general', 'ration'],
        ['supporter', 'support', 'port', 'porter'],
        ['niece', 'nice', 'piece', 'peace'],
        ['engage', 'cage', 'page', 'gauge'],
        ['anniversary', 'verse', 'very', 'ary'],
        ['lifetime', 'life', 'time', 'lime'],
        ['parental', 'parent', 'rent', 'rental'],
        ['breed', 'bread', 'bleed', 'greed'],
        ['obedient', 'obey', 'diet', 'audience'],
        ['interact', 'act', 'internet', 'inter'],
        ['funeral', 'fun', 'run', 'real'],
        ['sibling', 'bling', 'sing', 'ring'],
        ['resemble', 'assemble', 'tremble', 'symbol'],
        ['daycare', 'day', 'care', 'car'],
        ['pregnant', 'ant', 'nant', 'grant'],
        ['nurture', 'nature', 'future', 'torture'],
        ['accompany', 'company', 'any', 'pan'],
        ['spouse', 'house', 'mouse', 'blouse'],
        ['bring up', 'ring up', 'bring cup', 'bring out'],
        ['break up with', 'break up which', 'break out with', 'wake up with'],
        ['impression', 'press', 'mission', 'session'],
        ['typical', 'type', 'topic', 'topical'],
        ['attractive', 'attract', 'active', 'track'],
        ['passive', 'pass', 'massive', 'active'],
        ['impatient', 'patient', 'patent', 'impact'],
        ['ambitious', 'ambition', 'bit', 'bus'],
        ['arrogant', 'rogue', 'ant', 'elegant'],
        ['fierce', 'pierce', 'fear', 'force'],
        ['kindness', 'kind', 'ness', 'mess'],
        ['oval', 'over', 'all', 'vocal'],
        ['odd', 'add', 'old', 'off'],
        ['forehead', 'head', 'for', 'forward'],
        ['ignorant', 'ignore', 'ant', 'grant'],
        ['wrinkle', 'ink', 'link', 'twinkle'],
        ['greed', 'green', 'breed', 'reed'],
        ['take after', 'take over', 'look after', 'take a tear'],
        ['stand out', 'stand shout', 'hand out', 'stand about'],
        ['mood', 'moon', 'food', 'wood'],
        ['sorrow', 'borrow', 'tomorrow', 'arrow'],
        ['emotion', 'motion', 'ocean', 'notion'],
        ['anxious', 'ancient', 'any', 'us'],
        ['depression', 'press', 'deep', 'session'],
        ['weep', 'deep', 'jeep', 'sweep'],
        ['annoy', 'noise', 'toy', 'boy'],
        ['amaze', 'maze', 'gaze', 'craze'],
        ['sentiment', 'sent', 'mental', 'cement'],
        ['envy', 'ivy', 'heavy', 'navy'],
        ['jealous', 'zeal', 'loose', 'loss'],
        ['temper', 'temple', 'tempo', 'empire'],
        ['resent', 'recent', 'sent', 'rent'],
        ['desperate', 'rate', 'separate', 'ate'],
        ['disgust', 'dust', 'gust', 'just'],
        ['astound', 'sound', 'round', 'found'],
        ['frighten', 'fright', 'ten', 'right'],
        ['panic', 'pan', 'picnic', 'mechanic'],
        ['sympathy', 'path', 'pathetic', 'symphony'],
        ['ridicule', 'ride', 'rule', 'cool'],
        ['warm-hearted', 'warm-started', 'warm-parted', 'warm-carted'],
        ['burst into', 'burst in', 'burn into', 'bust into'],
        ['be tired of', 'be tired off', 'be fired of', 'be tied of'],
        ['put up with', 'put up which', 'come up with', 'put up wish'],
        ['fiber', 'fire', 'five', 'cyber'],
        ['instant', 'instance', 'ant', 'stand'],
        ['nourish', 'no', 'rush', 'flourish'],
        ['chop', 'shop', 'chip', 'hop'],
        ['grind', 'find', 'mind', 'kind'],
        ['roast', 'toast', 'coast', 'boast'],
        ['rotten', 'rot', 'ten', 'cotton'],
        ['grill', 'drill', 'thrill', 'bill'],
        ['edible', 'table', 'able', 'edit'],
        ['nutrition', 'nation', 'tree', 'mission'],
        ['vegetarian', 'vegetable', 'veterinarian', 'tarian'],
        ['dairy', 'diary', 'daily', 'airy'],
        ['kettle', 'kettle', 'cattle', 'battle'],
        ['tray', 'pray', 'gray', 'play'],
        ['seasoning', 'season', 'son', 'reason'],
        ['scent', 'cent', 'sent', 'scene'],
        ['leftover', 'left', 'over', 'cover'],
        ['beverage', 'age', 'average', 'rage'],
        ['ripen', 'pen', 'ripe', 'open'],
        ['paste', 'past', 'taste', 'waste'],
        ['blend', 'lend', 'end', 'bend'],
        ['go off', 'go on', 'go of', 'show off'],
        ['feed on', 'feed in', 'feel on', 'feed one'],
        ['costume', 'custom', 'cost', 'tomb'],
        ['thread', 'read', 'bread', 'head'],
        ['fashion', 'passion', 'session', 'cushion'],
        ['loose', 'lose', 'goose', 'moose'],
        ['fade', 'made', 'shade', 'grade'],
        ['formal', 'form', 'mall', 'normal'],
        ['fancy', 'fan', 'pan', 'fantasy'],
        ['outfit', 'out', 'fit', 'feet'],
        ['sew', 'saw', 'so', 'sow'],
        ['alter', 'altar', 'water', 'later'],
        ['trousers', 'user', 'rouse', 'browser'],
        ['vest', 'best', 'test', 'rest'],
        ['cotton', 'button', 'rotten', 'on'],
        ['fur', 'for', 'far', 'fir'],
        ['laundry', 'dry', 'land', 'dairy'],
        ['detergent', 'agent', 'gent', 'urgent'],
        ['dress up', 'mess up', 'press up', 'dress cup'],
        ['wear out', 'wear about', 'bear out', 'wear it'],
        ['show off', 'show of', 'snow off', 'blow off'],
        ['cottage', 'age', 'coat', 'cotton'],
        ['priceless', 'price', 'less', 'press'],
        ['mess', 'miss', 'mass', 'moss'],
        ['routine', 'route', 'tin', 'teen'],
        ['rely', 'reply', 'really', 'lie'],
        ['cleanse', 'clean', 'lens', 'clans'],
        ['wipe', 'pipe', 'ripe', 'type'],
        ['mop', 'map', 'top', 'hop'],
        ['drawer', 'draw', 'raw', 'award'],
        ['rubbish', 'rub', 'wish', 'fish'],
        ['dispose', 'pose', 'dose', 'expose'],
        ['discard', 'card', 'hard', 'discord'],
        ['appliance', 'apply', 'place', 'alliance'],
        ['spacious', 'space', 'us', 'gracious'],
        ['polish', 'pole', 'police', 'ish'],
        ['flush', 'flash', 'rush', 'brush'],
        ['nap', 'map', 'tap', 'lap'],
        ['outlet', 'let', 'out', 'layout'],
        ['trim', 'rim', 'trip', 'tram'],
        ['crack', 'rack', 'track', 'pack'],
        ['leak', 'lake', 'peak', 'weak'],
        ['hang up', 'hang out', 'bang up', 'hang cup'],
        ['insight', 'sight', 'in', 'site'],
        ['essence', 'sense', 'fence', 'dense'],
        ['intelligence', 'tell', 'gent', 'cell'],
        ['inspire', 'fire', 'spire', 'expire'],
        ['refer', 'prefer', 'defer', 'infer'],
        ['review', 'view', 'preview', 'renew'],
        ['linguistics', 'stick', 'list', 'link'],
        ['content', 'tent', 'context', 'contest'],
        ['concept', 'accept', 'except', 'precept'],
        ['principle', 'prince', 'principal', 'ple'],
        ['expose', 'pose', 'nose', 'repose'],
        ['define', 'fine', 'refine', 'confine'],
        ['demonstrate', 'monster', 'rate', 'straight'],
        ['conclude', 'include', 'exclude', 'cloud'],
        ['statistics', 'state', 'static', 'stick'],
        ['physics', 'physical', 'sick', 'six'],
        ['geology', 'geo', 'log', 'biology'],
        ['diameter', 'meter', 'dial', 'matter'],
        ['literal', 'liter', 'rally', 'lateral'],
        ['literate', 'rate', 'late', 'literature'],
        ['fluent', 'flu', 'flew', 'blue'],
        ['go over', 'go cover', 'do over', 'go ever'],
        ['dwell on', 'dwell in', 'well on', 'dwell one'],
        ['educate', 'cat', 'ate', 'duke'],
        ['instruct', 'struct', 'truck', 'construct'],
        ['lecture', 'ture', 'cure', 'picture'],
        ['due', 'do', 'dew', 'cue'],
        ['examine', 'mine', 'exam', 'determine'],
        ['multiply', 'multi', 'ply', 'apply'],
        ['calculate', 'late', 'call', 'cake'],
        ['memorize', 'memory', 'size', 'rise'],
        ['institute', 'stitute', 'cute', 'statue'],
        ['laboratory', 'labor', 'lavatory', 'story'],
        ['dormitory', 'dorm', 'story', 'door'],
        ['principal', 'prince', 'principle', 'pal'],
        ['aisle', 'isle', 'file', 'pile'],
        ['semester', 'master', 'mester', 'ester'],
        ['absent', 'accent', 'sent', 'consent'],
        ['attendance', 'dance', 'attend', 'entrance'],
        ['attitude', 'altitude', 'latitude', 'solitude'],
        ['eager', 'eagle', 'meager', 'beaver'],
        ['submit', 'summit', 'admit', 'permit'],
        ['portfolio', 'port', 'folio', 'buffalo'],
        ['peer', 'pear', 'pier', 'beer'],
        ['scholarship', 'scholar', 'ship', 'sharp'],
        ['grant', 'grand', 'ant', 'plant'],
        ['get along with', 'go along with', 'get along in', 'get long with'],
        ['catch up with', 'match up with', 'catch up on', 'patch up with'],
        ['drop out', 'drop in', 'drop off', 'pop out'],
        ['manufacture', 'factory', 'fracture', 'future'],
        ['operate', 'rate', 'cooperate', 'separate'],
        ['senior', 'junior', 'sensor', 'signor'],
        ['psychologist', 'logic', 'biology', 'cycle'],
        ['personnel', 'personal', 'person', 'channel'],
        ['barber', 'bar', 'harbor', 'rubber'],
        ['counselor', 'sell', 'council', 'console'],
        ['wage', 'age', 'cage', 'page'],
        ['shift', 'lift', 'sift', 'gift'],
        ['retire', 'tire', 'fire', 'entire'],
        ['supervise', 'visor', 'surprise', 'advise'],
        ['accomplish', 'polish', 'publish', 'abolish'],
        ['architect', 'detect', 'tech', 'protect'],
        ['secretary', 'secret', 'military', 'territory'],
        ['experienced', 'experience', 'experiment', 'expense'],
        ['vend', 'bend', 'end', 'send'],
        ['requirement', 'require', 'acquire', 'retirement'],
        ['superior', 'super', 'interior', 'exterior'],
        ['profession', 'professor', 'session', 'fashion'],
        ['application', 'apply', 'apple', 'station'],
        ['salary', 'celery', 'larry', 'sale'],
        ['labor', 'neighbor', 'harbor', 'later'],
        ['proficient', 'efficient', 'sufficient', 'profit'],
        ['prompt', 'prop', 'pump', 'romp'],
        ['insist on', 'persist on', 'insist in', 'exist on'],
        ['take charge of', 'take care of', 'take large of', 'in charge of'],
        ['economy', 'eco', 'enemy', 'anatomy'],
        ['commerce', 'mercy', 'commercial', 'immerse'],
        ['afford', 'ford', 'board', 'effort'],
        ['purchase', 'chase', 'purse', 'purpose'],
        ['luxury', 'jury', 'luck', 'flux'],
        ['install', 'stall', 'tall', 'install'],
        ['guarantee', 'guard', 'tea', 'warranty'],
        ['expense', 'pence', 'sense', 'expanse'],
        ['budget', 'jet', 'badge', 'gadget'],
        ['debt', 'bet', 'dead', 'doubt'],
        ['invest', 'vest', 'best', 'inquest'],
        ['profit', 'fit', 'prophet', 'pro'],
        ['contract', 'tract', 'contact', 'contrast'],
        ['enterprise', 'prize', 'enter', 'surprise'],
        ['property', 'proper', 'party', 'poverty'],
        ['currency', 'current', 'curry', 'accuracy'],
        ['consumer', 'consume', 'summer', 'assume'],
        ['wholesale', 'sale', 'whole', 'whale'],
        ['merchandise', 'merchant', 'dice', 'rise'],
        ['transaction', 'action', 'trans', 'traction'],
        ['bankruptcy', 'bank', 'rupt', 'corrupt'],
        ['marketing', 'market', 'mark', 'making'],
        ['pay back', 'pay pack', 'say back', 'lay back'],
        ['official', 'office', 'facial', 'special'],
        ['election', 'select', 'section', 'collection'],
        ['vote', 'boat', 'coat', 'note'],
        ['candidate', 'date', 'candy', 'date'],
        ['government', 'govern', 'mental', 'moment'],
        ['democracy', 'demo', 'crazy', 'bureaucracy'],
        ['welfare', 'fare', 'well', 'warfare'],
        ['reform', 'form', 'deform', 'inform'],
        ['protest', 'test', 'protect', 'contest'],
        ['declare', 'glare', 'flare', 'care'],
        ['nation', 'station', 'ration', 'notion'],
        ['unite', 'unit', 'night', 'knight'],
        ['diplomacy', 'diploma', 'place', 'macy'],
        ['authority', 'author', 'city', 'priority'],
        ['conservative', 'serve', 'reserve', 'conversation'],
        ['liberal', 'liberty', 'berry', 'literal'],
        ['republic', 'public', 'pub', 'replay'],
        ['parliament', 'cement', 'par', 'element'],
        ['municipality', 'city', 'pal', 'municipal'],
        ['corruption', 'corrupt', 'eruption', 'interruption'],
        ['stand for', 'stand four', 'stand far', 'stand fore'],
        ['pass a law', 'pass a raw', 'pass the law', 'pass a low'],
        ['forbid', 'bid', 'for', 'orbit'],
        ['obey', 'bay', 'day', 'okay'],
        ['violate', 'late', 'violet', 'violence'],
        ['guilty', 'guilt', 'quilt', 'built'],
        ['innocent', 'cent', 'scent', 'in no sense'],
        ['witness', 'wit', 'ness', 'fitness'],
        ['suspect', 'inspect', 'respect', 'expect'],
        ['punish', 'push', 'finish', 'vanish'],
        ['victim', 'tim', 'victory', 'victimize'],
        ['sue', 'zoo', 'shoe', 'blue'],
        ['theft', 'left', 'heft', 'deft'],
        ['assault', 'salt', 'fault', 'vault'],
        ['investigate', 'gate', 'vest', 'invest'],
        ['penalty', 'pen', 'alty', 'plenty'],
        ['verdict', 'diction', 'predict', 'addict'],
        ['attorney', 'tour', 'turn', 'journey'],
        ['jail', 'fail', 'mail', 'tail'],
        ['complaint', 'plain', 'paint', 'complain'],
        ['execution', 'cute', 'executive', 'action'],
        ['crime scene', 'crime seen', 'crime screen', 'time scene'],
        ['fraud', 'frog', 'broad', 'proud'],
        ['keep track of', 'keep back of', 'keep track off', 'keep crack of'],
        ['break into', 'break in', 'break two', 'break onto'],
        ['broadcast', 'cast', 'broad', 'forecast'],
        ['journalism', 'journal', 'ism', 'journey'],
        ['press', 'dress', 'mess', 'stress'],
        ['criticize', 'critic', 'size', 'critical'],
        ['network', 'net', 'work', 'wet work'],
        ['convey', 'survey', 'obey', 'convoy'],
        ['exaggerate', 'rate', 'egg', 'generate'],
        ['interfere', 'fear', 'inter', 'interface'],
        ['interrupt', 'rupt', 'erupt', 'corrupt'],
        ['subscriber', 'scribe', 'sub', 'describe'],
        ['headline', 'head', 'line', 'deadline'],
        ['censorship', 'ship', 'sensor', 'censor'],
        ['digital', 'digit', 'tal', 'capital'],
        ['interactive', 'act', 'active', 'inter'],
        ['platform', 'form', 'plate', 'flat'],
        ['get in touch with', 'get in touch', 'keep in touch with', 'get a touch with'],
        ['keep in mind', 'keep in mine', 'keep a mind', 'keep it mind'],
        ['exhibition', 'exhibit', 'habit', 'bit'],
        ['masterpiece', 'master', 'piece', 'peace'],
        ['sculpture', 'sculpt', 'culture', 'structure'],
        ['rehearse', 'hearse', 'hear', 'purse'],
        ['composition', 'position', 'compose', 'competition'],
        ['literature', 'literate', 'nature', 'creature'],
        ['leisure', 'sure', 'pleasure', 'measure'],
        ['creative', 'create', 'native', 'relative'],
        ['sketch', 'catch', 'fetch', 'stretch'],
        ['appreciation', 'appreciate', 'price', 'creation'],
        ['antique', 'anti', 'tick', 'unique'],
        ['hobby', 'lobby', 'bobby', 'habit'],
        ['recreation', 'create', 'creation', 'reaction'],
        ['entertain', 'enter', 'train', 'contain'],
        ['scenic', 'scene', 'nic', 'panic'],
        ['aesthetic', 'thetic', 'athletic', 'static'],
        ['abstract', 'tract', 'attract', 'contract'],
        ['contemporary', 'temporary', 'tempo', 'contrary'],
        ['genre', 'gene', 'general', 'john'],
        ['curator', 'cure', 'rate', 'creator'],
        ['perspective', 'spect', 'active', 'respective'],
        ['destination', 'nation', 'destiny', 'station'],
        ['departure', 'part', 'depart', 'feature'],
        ['arrival', 'arrive', 'rival', 'survival'],
        ['passenger', 'pass', 'anger', 'messenger'],
        ['vehicle', 'hicle', 'cubicle', 'icicle'],
        ['boarding', 'board', 'boring', 'hoarding'],
        ['itinerary', 'ary', 'iterate', 'literary'],
        ['accommodate', 'date', 'mode', 'commodity'],
        ['flight', 'light', 'fight', 'fright'],
        ['souvenir', 'near', 'soon', 'venom'],
        ['scenery', 'scene', 'screen', 'scary'],
        ['customs', 'custom', 'cost', 'customer'],
        ['delay', 'lay', 'play', 'relay'],
        ['vessel', 'sell', 'fossil', 'hassle'],
        ['accommodation', 'date', 'motion', 'nation'],
        ['passport', 'port', 'pass', 'sport'],
        ['visa', 'pizza', 'visit', 'vista'],
        ['fare', 'fair', 'far', 'fire'],
        ['landmark', 'mark', 'land', 'dark'],
        ['cruise', 'bruise', 'crew', 'cruz'],
        ['check in', 'check on', 'check it', 'check out'],
        ['set off', 'set of', 'set on', 'let off'],
        ['ecology', 'eco', 'logic', 'biology'],
        ['wildlife', 'wild', 'life', 'wife'],
        ['preserve', 'serve', 'reserve', 'observe'],
        ['renewable', 'new', 'able', 'renew'],
        ['disaster', 'aster', 'star', 'master'],
        ['drought', 'doubt', 'route', 'trout'],
        ['carbon', 'car', 'bone', 'bon'],
        ['atmosphere', 'sphere', 'atom', 'here'],
        ['climate', 'mate', 'climb', 'climax'],
        ['extinct', 'tin', 'distinct', 'instinct'],
        ['conserve', 'serve', 'reserve', 'concert'],
        ['purify', 'pure', 'fury', 'verify'],
        ['emission', 'mission', 'miss', 'omission'],
        ['toxic', 'taxi', 'tick', 'topic'],
        ['global warming', 'global warning', 'global swarming', 'global worming'],
        ['alternative', 'alter', 'native', 'turn'],
        ['sustainable', 'sustain', 'able', 'stain'],
        ['ecosystem', 'eco', 'system', 'stem'],
        ['phenomenon', 'no', 'men', 'phone'],
        ['glacier', 'glass', 'glacier', 'glazier'],
        ['deal with', 'deal in', 'heal with', 'deal which'],
        ['protect A from B', 'protect A for B', 'project A from B', 'protect A form B'],
        ['science', 'sign', 'silence', 'sense'],
        ['technology', 'tech', 'logy', 'techno'],
        ['discover', 'cover', 'disk', 'recover'],
        ['gravity', 'grave', 'cavity', 'brevity'],
        ['automatic', 'auto', 'matic', 'atom'],
        ['efficient', 'fish', 'effect', 'sufficient'],
        ['innovation', 'nova', 'nation', 'ovation'],
        ['precision', 'press', 'decision', 'incision'],
        ['component', 'ponent', 'opponent', 'exponent'],
        ['breakthrough', 'break', 'through', 'though'],
        ['procedure', 'proceed', 'cure', 'endure'],
        ['come up with', 'come up which', 'catch up with', 'come out with'],
        ['turn out to be', 'turn out to me', 'turn out too be', 'burn out to be'],
        ['immune', 'moon', 'tune', 'dune'],
        ['bacteria', 'back', 'tear', 'area'],
        ['symptom', 'tom', 'simple', 'system'],
        ['physician', 'physics', 'physical', 'musician'],
        ['surgery', 'surge', 'jury', 'sugary'],
        ['remedy', 'ready', 'melody', 'med'],
        ['obesity', 'city', 'best', 'obese'],
        ['vaccine', 'scene', 'seen', 'vac'],
        ['exhausted', 'exhaust', 'haust', 'existed'],
        ['fitness', 'fit', 'ness', 'witness'],
        ['diagnose', 'nose', 'dose', 'diagonal'],
        ['fatal', 'fate', 'tall', 'metal'],
        ['hygiene', 'gene', 'high', 'gene'],
        ['chronic', 'crony', 'tonic', 'sonic'],
        ['supplement', 'supply', 'element', 'supper'],
        ['stamina', 'mine', 'stand', 'star'],
        ['suffer from', 'suffer for', 'supper from', 'suffer form'],
        ['get over', 'get cover', 'go over', 'get ever'],
        ['intellect', 'tell', 'elect', 'select'],
        ['notion', 'nation', 'motion', 'lotion'],
        ['philosophy', 'sophy', 'fill', 'trophy'],
        ['perception', 'cept', 'reception', 'deception'],
        ['recognize', 'size', 'nice', 'organize'],
        ['comprehend', 'prehend', 'hand', 'apprehend'],
        ['assume', 'sum', 'consume', 'resume'],
        ['contemplate', 'plate', 'temple', 'template'],
        ['reasoning', 'reason', 'son', 'season'],
        ['intuition', 'tuition', 'into', 'institution'],
        ['judgment', 'judge', 'ment', 'adjustment'],
        ['objective', 'object', 'active', 'subject'],
        ['subjective', 'subject', 'active', 'object'],
        ['rational', 'ration', 'nation', 'national'],
        ['prejudice', 'judice', 'juice', 'pride'],
        ['delusion', 'lusion', 'illusion', 'allusion'],
        ['memory', 'memo', 'more', 'armory'],
        ['forgetful', 'forget', 'full', 'get'],
        ['meditate', 'date', 'ate', 'mediate'],
        ['awareness', 'ware', 'ness', 'aware'],
        ['bias', 'buy', 'bus', 'base'],
        ['illusion', 'ill', 'lusion', 'allusion'],
        ['bear in mind', 'bare in mind', 'bear a mind', 'bear in mine'],
        ['proclaim', 'claim', 'aim', 'reclaim'],
        ['dialogue', 'log', 'dial', 'catalog'],
        ['dispute', 'put', 'repute', 'compute'],
        ['negotiate', 'go', 'ate', 'associate'],
        ['advocate', 'vocal', 'ate', 'avocado'],
        ['emphasize', 'size', 'phase', 'size'],
        ['contradict', 'dict', 'contra', 'predict'],
        ['verbal', 'verb', 'ball', 'herbal'],
        ['non-verbal', 'non', 'verb', 'verbal'],
        ['feedback', 'feed', 'back', 'feet'],
        ['slang', 'sang', 'lang', 'slam'],
        ['vocabulary', 'vocal', 'cab', 'lary'],
        ['grammar', 'gram', 'hammer', 'glamour'],
        ['translate', 'late', 'slate', 'relate'],
        ['statement', 'state', 'men', 'ment'],
        ['rumor', 'room', 'humor', 'tumor'],
        ['gossip', 'sip', 'go', 'sip'],
        ['expressive', 'press', 'express', 'impressive'],
        ['keep in touch with', 'keep in touch', 'get in touch with', 'keep a touch with'],
        ['point out', 'point at', 'print out', 'point it'],
        ['infinite', 'fin', 'finite', 'definite'],
        ['dimension', 'mention', 'men', 'tension'],
        ['vacuum', 'vac', 'room', 'volume'],
        ['galaxy', 'ax', 'lax', 'taxi'],
        ['astronomy', 'astro', 'no', 'autonomy'],
        ['telescope', 'scope', 'tell', 'tele'],
        ['orbit', 'bit', 'or', 'habit'],
        ['asteroid', 'ster', 'void', 'steroid'],
        ['comet', 'met', 'come', 'comment'],
        ['existence', 'exist', 'tense', 'distance'],
        ['eternal', 'tern', 'turn', 'external'],
        ['void', 'avoid', 'voice', 'droid'],
        ['cosmos', 'moss', 'most', 'cause'],
        ['sphere', 'here', 'fear', 'spear'],
        ['vertical', 'vert', 'call', 'article'],
        ['horizontal', 'horizon', 'zone', 'tal'],
        ['parallel', 'para', 'all', 'elle'],
        ['radius', 'radio', 'us', 'radish'],
        ['expansion', 'pan', 'pension', 'mansion'],
        ['density', 'city', 'den', 'dense'],
        ['heritage', 'age', 'tag', 'inherit'],
        ['custom', 'cost', 'tom', 'costume'],
        ['norm', 'form', 'storm', 'dorm'],
        ['hierarchy', 'arch', 'high', 'archy'],
        ['diversity', 'city', 'verse', 'university'],
        ['ethnic', 'nic', 'thick', 'ethics'],
        ['minority', 'minor', 'city', 'priority'],
        ['majority', 'major', 'city', 'priority'],
        ['equality', 'equal', 'city', 'quality'],
        ['inequality', 'equal', 'in', 'quality'],
        ['discrimination', 'nation', 'crime', 'crimination'],
        ['racism', 'race', 'ism', 'prism'],
        ['immigrant', 'grant', 'migrant', 'ant'],
        ['migration', 'grate', 'ration', 'migration'],
        ['integration', 'grate', 'ration', 'integrity'],
        ['monarchy', 'arch', 'mon', 'march'],
        ['anarchy', 'arch', 'an', 'archy'],
        ['socialize', 'social', 'size', 'realize'],
        ['individualism', 'individual', 'ism', 'dualism'],
        ['patriotism', 'patriot', 'ism', 'riot'],
        ['comply with', 'comply which', 'supply with', 'imply with'],
        ['conform to', 'confirm to', 'conform too', 'form to'],
        ['hostility', 'host', 'tile', 'hospitality'],
        ['humiliate', 'late', 'human', 'humility'],
        ['empathy', 'path', 'pathy', 'sympathy'],
        ['affection', 'affect', 'fection', 'infection'],
        ['passion', 'pass', 'session', 'fashion'],
        ['enthusiasm', 'siasm', 'thus', 'spasm'],
        ['optimism', 'mist', 'ism', 'opt'],
        ['pessimism', 'pest', 'ism', 'miss'],
        ['indifference', 'differ', 'fence', 'difference'],
        ['contempt', 'tempt', 'attempt', 'content'],
        ['compassion', 'pass', 'passion', 'compass'],
        ['gratitude', 'tude', 'attitude', 'great'],
        ['guilt', 'quilt', 'built', 'kilt'],
        ['remorse', 'morse', 'horse', 'worse'],
        ['fury', 'fury', 'furry', 'jury'],
        ['jealousy', 'jealous', 'lousy', 'sea'],
        ['scorn', 'corn', 'horn', 'born'],
        ['delight', 'light', 'flight', 'daylight'],
        ['despair', 'pair', 'spare', 'repair'],
        ['frustration', 'ration', 'trust', 'station'],
        ['anticipation', 'pate', 'nation', 'participation'],
        ['dread', 'read', 'bread', 'dead'],
        ['contentment', 'content', 'ment', 'tent'],
        ['resentment', 'resent', 'ment', 'sent'],
        ['tolerance', 'ance', 'toll', 'clearance'],
        ['preoccupation', 'occupy', 'cup', 'occupation'],
        ['aspiration', 'ration', 'spire', 'inspiration'],
        ['skepticism', 'skeptic', 'ism', 'optic'],
        ['be inclined to', 'be inclined too', 'be declined to', 'be included to'],
        ['transform', 'form', 'trans', 'reform'],
        ['modify', 'mode', 'defy', 'codify'],
        ['impact', 'pact', 'act', 'compact'],
        ['consequence', 'sequence', 'quence', 'ence'],
        ['drastic', 'tick', 'plastic', 'elastic'],
        ['gradual', 'grade', 'dual', 'graduate'],
        ['constant', 'stant', 'ant', 'instant'],
        ['temporary', 'tempo', 'porary', 'contemporary'],
        ['permanent', 'nent', 'man', 'per'],
        ['fluctuate', 'flu', 'ate', 'late'],
        ['stability', 'stable', 'ability', 'city'],
        ['instability', 'stable', 'ability', 'stability'],
        ['influence', 'flu', 'fence', 'fluent'],
        ['trigger', 'tiger', 'rig', 'digger'],
        ['stimulate', 'late', 'mule', 'state'],
        ['lead to', 'read to', 'lead too', 'led to'],
        ['outcome', 'out', 'come', 'income'],
        ['substitution', 'stitution', 'sub', 'institution'],
        ['interchange', 'change', 'inter', 'charge'],
        ['reverse', 'verse', 'universe', 'reserve'],
        ['adaptation', 'adapt', 'station', 'adoption'],
        ['sacred', 'red', 'scare', 'acre'],
        ['ethics', 'thick', 'ethnic', 'sick'],
        ['worship', 'ship', 'war', 'worth'],
        ['conscience', 'science', 'con', 'conscious'],
        ['divine', 'vine', 'wine', 'fine'],
        ['moral', 'oral', 'more', 'coral'],
        ['immoral', 'moral', 'more', 'immortal'],
        ['shrine', 'shine', 'line', 'whine'],
        ['faith', 'fate', 'face', 'eighth'],
        ['doctrine', 'doc', 'doctor', 'trine'],
        ['sin', 'tin', 'bin', 'thin'],
        ['pardon', 'don', 'par', 'garden'],
        ['curse', 'nurse', 'purse', 'course'],
        ['prophet', 'profit', 'pro', 'fit'],
        ['spiritual', 'spirit', 'ritual', 'dual'],
        ['secular', 'lar', 'circular', 'muscular'],
        ['monk', 'monkey', 'bunk', 'sunk'],
        ['preach', 'reach', 'peach', 'breach'],
        ['salvation', 'nation', 'vation', 'starvation'],
        ['paradise', 'par', 'dice', 'parade'],
        ['evil', 'ville', 'ill', 'devil'],
        ['temptation', 'tempt', 'station', 'nation'],
        ['charity', 'city', 'chat', 'parity'],
        ['benevolence', 'lence', 'vol', 'violence'],
        ['believe in', 'believe on', 'believe it', 'relieve in'],
        ['devote oneself to', "devote one's self to", 'devote oneself too', 'vote oneself to'],
        ['casualty', 'casual', 'alty', 'penalty'],
        ['urgent', 'gent', 'agent', 'urge'],
        ['evacuate', 'vac', 'ate', 'evaluate'],
        ['security', 'cure', 'city', 'secure'],
        ['rescue', 'cue', 'rest', 'screw'],
        ['hazard', 'hard', 'yard', 'lizard'],
        ['precaution', 'caution', 'auction', 'pre'],
        ['crisis', 'cry', 'sis', 'basis'],
        ['emergency', 'merge', 'agency', 'urgency'],
        ['collision', 'lision', 'vision', 'collusion'],
        ['explosion', 'plosion', 'sion', 'implosion'],
        ['debris', 'brie', 'degree', 'decree'],
        ['devastate', 'state', 'vast', 'ate'],
        ['fatality', 'fate', 'alty', 'fatal'],
        ['first aid', 'first aide', 'first paid', 'fast aid'],
        ['extinguish', 'guish', 'distinguish', 'english'],
        ['shelter', 'shell', 'ter', 'helter'],
        ['vulnerable', 'able', 'ner', 'venerable'],
        ['threaten', 'threat', 'ten', 'eaten'],
        ['prevention', 'vent', 'vention', 'invention'],
        ['keep an eye on', 'keep an eye in', 'keep one eye on', 'keep an eye off'],
        ['call off', 'call of', 'call out', 'fall off'],
        ['inflation', 'flat', 'nation', 'deflation'],
        ['monetary', 'money', 'ary', 'solitary'],
        ['finance', 'fine', 'ance', 'fiancé'],
        ['surplus', 'plus', 'sur', 'surface'],
        ['deficit', 'fit', 'cit', 'defeat'],
        ['revenue', 'venue', 'avenue', 'new'],
        ['expenditure', 'spend', 'ture', 'texture'],
        ['investment', 'vest', 'invest', 'ment'],
        ['asset', 'set', 'ass', 'offset'],
        ['liability', 'able', 'ability', 'lie'],
        ['interest rate', 'interest late', 'interest date', 'internet rate'],
        ['mortgage', 'gage', 'age', 'engage'],
        ['corporation', 'ration', 'rate', 'cooperation'],
        ['subsidiary', 'diary', 'sub', 'subsidy'],
        ['monopoly', 'poly', 'mono', 'pole'],
        ['audit', 'dit', 'edit', 'audio'],
        ['fiscal', 'cal', 'physical', 'scale'],
        ['commodity', 'mode', 'dit', 'oddity'],
        ['consumption', 'sum', 'sumption', 'assumption'],
        ['distribution', 'tribute', 'bution', 'contribution'],
        ['exchange rate', 'change rate', 'exchange late', 'range rate'],
        ['incentive', 'cent', 'tive', 'intensive'],
        ['infrastructure', 'struct', 'structure', 'fracture'],
        ['take over', 'take cover', 'take ever', 'make over'],
        ['cut down on', 'cut down in', 'put down on', 'cut down off'],
        ['litigation', 'gate', 'gation', 'mitigation'],
        ['defendant', 'defend', 'ant', 'pendant'],
        ['testify', 'test', 'fy', 'justify'],
        ['valid', 'lid', 'valley', 'solid'],
        ['enforce', 'force', 'in force', 'divorce'],
        ['plaintiff', 'plain', 'tiff', 'plaint'],
        ['prosecute', 'cute', 'execute', 'persecute'],
        ['defense', 'fence', 'dense', 'offense'],
        ['sentence', 'tense', 'sense', 'ten'],
        ['fine', 'pine', 'line', 'vine'],
        ['appeal', 'peel', 'meal', 'seal'],
        ['compliance', 'ply', 'ance', 'alliance'],
        ['legitimate', 'mate', 'time', 'legal'],
        ['bribery', 'bribe', 'berry', 'robbery'],
        ['felony', 'melon', 'fell', 'colony'],
        ['misdemeanor', 'mean', 'demeanor', 'manner'],
        ['testimony', 'test', 'mony', 'money'],
        ['interrogate', 'gate', 'rate', 'rogate'],
        ['custody', 'study', 'custom', 'tody'],
        ['compensation', 'pensation', 'pen', 'dispensation'],
        ['break the law', 'break the raw', 'brake the law', 'break a law'],
        ['abide by', 'a bide by', 'abide buy', 'side by'],
        ['vague', 'bag', 'plague', 'big'],
        ['obscure', 'cure', 'sure', 'cure'],
        ['subtle', 'shuttle', 'bottle', 'title'],
        ['evident', 'dent', 'evidence', 'event'],
        ['abrupt', 'rupt', 'corrupt', 'erupt'],
        ['intense', 'tense', 'ten', 'sense'],
        ['minute', 'min', 'nut', 'mute'],
        ['adequate', 'ate', 'quate', 'equate'],
        ['insufficient', 'fish', 'sufficient', 'efficient'],
        ['abundant', 'bun', 'ant', 'abandon'],
        ['scarce', 'scare', 'car', 'scarf'],
        ['flexible', 'flex', 'able', 'reflex'],
        ['rigid', 'rid', 'frigid', 'bridge'],
        ['durable', 'able', 'dura', 'curable'],
        ['fragile', 'agile', 'file', 'fragment'],
        ['precise', 'cise', 'price', 'concise'],
        ['random', 'ran', 'dom', 'ransom'],
        ['explicit', 'cit', 'elicit', 'implicit'],
        ['implicit', 'cit', 'explicit', 'imply'],
        ['trivial', 'via', 'trial', 'trivial'],
        ['crucial', 'cial', 'crude', 'social'],
        ['superficial', 'face', 'official', 'super'],
        ['profound', 'found', 'round', 'pound'],
        ['at random', 'at ransom', 'a random', 'at phantom'],
        ['in general', 'in genial', 'in generous', 'a general'],
        ['coincide', 'cide', 'side', 'inside'],
        ['simultaneous', 'neo', 'us', 'spontaneous'],
        ['essential', 'sense', 'tial', 'potential'],
        ['fundamental', 'fund', 'mental', 'dental'],
        ['ultimate', 'mate', 'ate', 'intimate'],
        ['comprehensive', 'hen', 'hensive', 'apprehensive'],
        ['exclusive', 'clusive', 'clue', 'elusive'],
        ['preliminary', 'limit', 'mary', 'primary'],
        ['dominant', 'ant', 'dom', 'dominate'],
        ['inherent', 'here', 'rent', 'coherent'],
        ['potential', 'tent', 'tial', 'potent'],
        ['primary', 'mary', 'prime', 'dairy'],
        ['secondary', 'second', 'ary', 'dairy'],
        ['terminal', 'term', 'min', 'germinal'],
        ['consistent', 'sist', 'tent', 'constant'],
        ['apparent', 'parent', 'pear', 'rent'],
        ['probable', 'able', 'probe', 'problem'],
        ['feasible', 'feast', 'able', 'visible'],
        ['extraordinary', 'extra', 'ordinary', 'dairy'],
        ['take advantage of', 'take advantage off', 'make advantage of', 'take a vantage of'],
        ['make up for', 'make up four', 'make up from', 'take up for'],
        ['look forward to', 'look forward too', 'look for to', 'look foreword to'],
        ['keep up with', 'keep up which', 'keep us with', 'keep up wit'],
        ['result from', 'result form', 'result in', 'result for'],
        ['bring about', 'ring about', 'bring out', 'bring a boat'],
        ['get used to', 'get use to', 'get used two', 'used to'],
    ];
})();
