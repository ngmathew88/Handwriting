// Pre-made worksheets for the seasonal suggestions (King James Version, public
// domain). These load instantly and work even if the Bible text service is down.
// Anything else people search for gets saved automatically in data/store.json.
//
// Format: 'Reference': [title, reflection prompt, [[verse number, text], ...]]

export const SEED_TRANSLATION = 'kjv';

export const SEED_VERSES = {
  'John 3:16': ['God So Loved the World', 'Draw a picture of the whole world wrapped in God’s love.', [
    [16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'],
  ]],
  'Romans 5:8': ['Jesus Loves Us', 'Draw a heart and put the names of people Jesus loves inside it.', [
    [8, 'But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.'],
  ]],
  'John 15:13': ['The Greatest Love', 'Draw a picture of a way you can show love to a friend.', [
    [13, 'Greater love hath no man than this, that a man lay down his life for his friends.'],
  ]],
  'Isaiah 53:5': ['Jesus Heals Us', 'Draw the cross and something that reminds you Jesus makes us whole.', [
    [5, 'But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.'],
  ]],
  '1 John 4:10': ['This Is Love', 'Draw a picture of God sending His Son because He loves us.', [
    [10, 'Herein is love, not that we loved God, but that he loved us, and sent his Son to be the propitiation for our sins.'],
  ]],
  'Matthew 21:9': ['Hosanna!', 'Draw the crowd waving palm branches as Jesus rides into town.', [
    [9, 'And the multitudes that went before, and that followed, cried, saying, Hosanna to the son of David: Blessed is he that cometh in the name of the Lord; Hosanna in the highest.'],
  ]],
  'Psalm 118:26': ['Blessed Is He', 'Draw yourself welcoming Jesus with a big wave.', [
    [26, 'Blessed be he that cometh in the name of the LORD: we have blessed you out of the house of the LORD.'],
  ]],
  'John 13:34': ['Love One Another', 'Draw a picture of you being kind to someone this week.', [
    [34, 'A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another.'],
  ]],
  'Luke 22:19': ['Remember Jesus', 'Draw Jesus sharing bread with His friends.', [
    [19, 'And he took bread, and gave thanks, and brake it, and gave unto them, saying, This is my body which is given for you: this do in remembrance of me.'],
  ]],
  'Matthew 28:6': ['He Is Risen!', 'Draw the empty tomb with the stone rolled away.', [
    [6, 'He is not here: for he is risen, as he said. Come, see the place where the Lord lay.'],
  ]],
  'John 11:25': ['Jesus Gives Life', 'Draw something that shows new life, like a flower or a butterfly.', [
    [25, 'Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live:'],
  ]],
  '1 Corinthians 15:57': ['Victory in Jesus', 'Draw yourself cheering because Jesus won!', [
    [57, 'But thanks be to God, which giveth us the victory through our Lord Jesus Christ.'],
  ]],
  '2 Corinthians 5:17': ['All Things New', 'Draw something new, like a sunrise, a seed sprouting, or a butterfly.', [
    [17, 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.'],
  ]],
  'Psalm 118:24': ['This Is the Day!', 'Draw something happy you did today.', [
    [24, 'This is the day which the LORD hath made; we will rejoice and be glad in it.'],
  ]],
  'Acts 2:4': ['Filled with the Spirit', 'Draw the disciples with flames of fire above their heads.', [
    [4, 'And they were all filled with the Holy Ghost, and began to speak with other tongues, as the Spirit gave them utterance.'],
  ]],
  'Acts 1:8': ['You Will Be Witnesses', 'Draw someone you could tell about Jesus.', [
    [8, 'But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.'],
  ]],
  'Galatians 5:22-23': ['The Fruit of the Spirit', 'Draw a tree full of fruit and name each fruit of the Spirit.', [
    [22, 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,'],
    [23, 'Meekness, temperance: against such there is no law.'],
  ]],
  'John 14:26': ['The Helper Is Here', 'Draw a time when you needed help and God was with you.', [
    [26, 'But the Comforter, which is the Holy Ghost, whom the Father will send in my name, he shall teach you all things, and bring all things to your remembrance, whatsoever I have said unto you.'],
  ]],
  'Romans 15:13': ['Full of Hope', 'Draw something that makes you feel joyful and peaceful.', [
    [13, 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.'],
  ]],
  'Luke 2:11': ['A Savior Is Born', 'Draw baby Jesus in the manger.', [
    [11, 'For unto you is born this day in the city of David a Saviour, which is Christ the Lord.'],
  ]],
  'Luke 2:10': ['Good News of Great Joy', 'Draw the angel bringing good news to the shepherds.', [
    [10, 'And the angel said unto them, Fear not: for, behold, I bring you good tidings of great joy, which shall be to all people.'],
  ]],
  'Luke 2:14': ['Glory to God!', 'Draw the angels singing in the night sky.', [
    [14, 'Glory to God in the highest, and on earth peace, good will toward men.'],
  ]],
  'Matthew 1:23': ['God with Us', 'Draw a picture of a place where God is with you.', [
    [23, 'Behold, a virgin shall be with child, and shall bring forth a son, and they shall call his name Emmanuel, which being interpreted is, God with us.'],
  ]],
  'Isaiah 9:6': ['Unto Us a Child Is Born', 'Draw a crown for Jesus, the Prince of Peace.', [
    [6, 'For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace.'],
  ]],
  'Isaiah 7:14': ['Immanuel', 'Draw the star shining over Bethlehem.', [
    [14, 'Therefore the Lord himself shall give you a sign; Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel.'],
  ]],
  'John 1:5': ['The Light Shines', 'Draw a bright light shining in the dark.', [
    [5, 'And the light shineth in darkness; and the darkness comprehended it not.'],
  ]],
  'Psalm 130:5': ['I Wait for the Lord', 'Draw something you are waiting for this Christmas.', [
    [5, 'I wait for the LORD, my soul doth wait, and in his word do I hope.'],
  ]],
  'Psalm 51:10': ['A Clean Heart', 'Draw a big clean heart and something God helps you do better.', [
    [10, 'Create in me a clean heart, O God; and renew a right spirit within me.'],
  ]],
  'Matthew 4:4': ['Every Word of God', 'Draw your favorite Bible story.', [
    [4, 'But he answered and said, It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.'],
  ]],
  'Joel 2:13': ['Turn to the Lord', 'Draw yourself talking to God in prayer.', [
    [13, 'And rend your heart, and not your garments, and turn unto the LORD your God: for he is gracious and merciful, slow to anger, and of great kindness, and repenteth him of the evil.'],
  ]],
  'Psalm 119:105': ['A Lamp for My Feet', 'Draw a lamp lighting up a path.', [
    [105, 'Thy word is a lamp unto my feet, and a light unto my path.'],
  ]],
  'Matthew 6:21': ['Where Your Treasure Is', 'Draw a treasure chest full of things that matter to God.', [
    [21, 'For where your treasure is, there will your heart be also.'],
  ]],
  'Psalm 107:1': ['Give Thanks!', 'Draw three things you are thankful for.', [
    [1, 'O give thanks unto the LORD, for he is good: for his mercy endureth for ever.'],
  ]],
  '1 Thessalonians 5:18': ['Thankful in Everything', 'Draw your family around a table saying thank you to God.', [
    [18, 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.'],
  ]],
  'Psalm 100:4': ['Enter with Thanksgiving', 'Draw yourself walking into church with a happy heart.', [
    [4, 'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.'],
  ]],
  'James 1:17': ['Every Good Gift', 'Draw a present with your favorite gift from God inside.', [
    [17, 'Every good gift and every perfect gift is from above, and cometh down from the Father of lights, with whom is no variableness, neither shadow of turning.'],
  ]],
  'Psalm 9:1': ['With My Whole Heart', 'Draw one wonderful thing God made.', [
    [1, 'I will praise thee, O LORD, with my whole heart; I will shew forth all thy marvellous works.'],
  ]],
  'Proverbs 31:28': ['A Blessed Mom', 'Draw a picture for your mom or someone who cares for you.', [
    [28, 'Her children arise up, and call her blessed; her husband also, and he praiseth her.'],
  ]],
  'Proverbs 31:25': ['Strength and Honor', 'Draw a strong and kind woman you love.', [
    [25, 'Strength and honour are her clothing; and she shall rejoice in time to come.'],
  ]],
  'Exodus 20:12': ['Honor Your Parents', 'Draw a way you can help your family at home.', [
    [12, 'Honour thy father and thy mother: that thy days may be long upon the land which the LORD thy God giveth thee.'],
  ]],
  'Isaiah 66:13': ['God Comforts Me', 'Draw a big hug.', [
    [13, 'As one whom his mother comforteth, so will I comfort you; and ye shall be comforted in Jerusalem.'],
  ]],
  '1 John 4:7': ['Love Comes from God', 'Draw you and a friend showing love to each other.', [
    [7, 'Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.'],
  ]],
  'Psalm 103:13': ['Like a Loving Father', 'Draw a picture for your dad or someone who takes care of you.', [
    [13, 'Like as a father pitieth his children, so the LORD pitieth them that fear him.'],
  ]],
  'Proverbs 22:6': ['Growing in God’s Way', 'Draw something you are learning to do.', [
    [6, 'Train up a child in the way he should go: and when he is old, he will not depart from it.'],
  ]],
  '1 John 3:1': ['Children of God', 'Draw yourself as part of God’s big family.', [
    [1, 'Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not.'],
  ]],
  'Proverbs 3:5': ['Trust in the Lord', 'Draw a time when you trusted God.', [
    [5, 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.'],
  ]],
  'Joshua 1:9': ['Be Strong and Brave', 'Draw something brave you can do because God is with you.', [
    [9, 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.'],
  ]],
  'Philippians 4:13': ['I Can Do All Things', 'Draw something hard that Jesus helps you do.', [
    [13, 'I can do all things through Christ which strengtheneth me.'],
  ]],
  'James 1:5': ['Ask God for Wisdom', 'Draw yourself asking God for help at school.', [
    [5, 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.'],
  ]],
  '1 John 4:19': ['He First Loved Us', 'Draw a heart and write the name of someone you love inside it.', [
    [19, 'We love him, because he first loved us.'],
  ]],
};

// Common descriptions people type instead of a reference. Used when the AI
// helper isn't configured, and as a head start when it is.
export const FAMOUS_PASSAGES = {
  "the lord's prayer": 'Matthew 6:9-13',
  'lords prayer': 'Matthew 6:9-13',
  'our father': 'Matthew 6:9-13',
  'psalm 23': 'Psalm 23',
  'the lord is my shepherd': 'Psalm 23:1',
  'love is patient': '1 Corinthians 13:4-7',
  'charity suffereth long': '1 Corinthians 13:4-7',
  'the golden rule': 'Matthew 7:12',
  'fruit of the spirit': 'Galatians 5:22-23',
  'the great commission': 'Matthew 28:19-20',
  'the beatitudes': 'Matthew 5:3-10',
  'the ten commandments': 'Exodus 20:3-17',
  'jesus wept': 'John 11:35',
  'be still and know': 'Psalm 46:10',
  'fearfully and wonderfully made': 'Psalm 139:14',
  'in the beginning': 'Genesis 1:1',
  'let the little children come': 'Matthew 19:14',
  'this little light of mine': 'Matthew 5:16',
  'i am the way': 'John 14:6',
  'the armor of god': 'Ephesians 6:11',
};
