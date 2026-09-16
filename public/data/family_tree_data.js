/**
 * Hainan Wenchang Zhu Family Lineage (海南省文昌市 祝氏族谱)
 * Comprehensive Family Tree Dataset
 * Spanning Ancient Progenitors to Hainan Founding Ancestor Zhu Dehui,
 * 1st Founding Ancestor Zhu Gao (祝高), down 21 generations to Mingcan (明灿) and Yun (运).
 */

(function() {
  const treeNodes = [
    // -------------------------------------------------------------
    // ANCIENT & HISTORICAL ROOTS (Pre-Hainan)
    // -------------------------------------------------------------
    {
      id: "huangdi",
      name: "黄帝 (Yellow Emperor)",
      pinyin: "Huáng Dì",
      gen: -3,
      genName: "Mythological Ancestor",
      genChar: "帝",
      fatherId: null,
      branch: "Ancient Progenitor",
      location: "Central Plains (中原)",
      page: 10,
      notes: "Traditional progenitor of the Huaxia nation. Zhu clan traces lineage directly to Yellow Emperor through Zhurong.",
      isCore: true
    },
    {
      id: "zhurong",
      name: "祝融 (Zhurong)",
      pinyin: "Zhù Róng",
      gen: -2,
      genName: "Minister of Fire (火正)",
      genChar: "融",
      fatherId: "huangdi",
      branch: "Ancient Progenitor",
      location: "Central Plains",
      page: 10,
      notes: "Appointed Minister of Fire under the Yellow Emperor. Descendants took 'Zhu' as state and surname.",
      isCore: true
    },
    {
      id: "zhuguo_duke",
      name: "祝国始封君 (Duke of State of Zhu)",
      pinyin: "Zhù Guó Jūn",
      gen: -1,
      genName: "Western Zhou (1046 BC)",
      genChar: "祝",
      fatherId: "zhurong",
      branch: "State of Zhu (Shandong)",
      location: "Changqing, Shandong (山东长清)",
      page: 10,
      notes: "King Wu of Zhou enfeoffed descendants of Zhurong at the State of Zhu. Royals adopted Zhu as family surname.",
      isCore: true
    },
    {
      id: "taiyuan_ancestor",
      name: "太原郡望世家 (Taiyuan Commandery Seat)",
      pinyin: "Tàiyuán Jùn",
      gen: 0,
      genName: "Han – Song Imperial Seat",
      genChar: "原",
      fatherId: "zhuguo_duke",
      branch: "Taiyuan Ancestral Hall",
      location: "Taiyuan, Shanxi (山西太原)",
      page: 10,
      notes: "Preeminent historical ancestral hall ('Taiyuan Jun'). Clan migrated southeast through Jiangxi and Fujian (Putian/Dexing).",
      isCore: true
    },
    {
      id: "dehui",
      name: "祝德辉 (Lord Zhu Dehui)",
      pinyin: "Zhù Déhuī",
      gen: 0,
      genName: "Hainan Island Founding Ancestor",
      genChar: "德",
      fatherId: "taiyuan_ancestor",
      branch: "Wanning Mother Branch (万州)",
      location: "Dexing, Fujian ➔ Wanning, Hainan (万宁/万州)",
      page: 13,
      notes: "Early Ming Dynasty magistrate who crossed the Qiongzhou Strait from Dexing County, Fujian to govern Wanyang (Wanning). Mother ancestor of all Hainan Zhu lines.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 1: WENCHANG FOUNDER
    // -------------------------------------------------------------
    {
      id: "gen1_gao",
      name: "祝高 (Zhu Gao / 祖高公)",
      pinyin: "Zhù Gāo",
      gen: 1,
      genName: "1st Generation · Wenchang Founder (一世始祖)",
      genChar: "高",
      fatherId: "dehui",
      branch: "Gaolong Village (Founding Seat)",
      location: "Gaolong Village, Qinglan Town, Wenchang (清澜高隆村)",
      page: 22,
      notes: "5th-gen descendant of Dehui in Hainan. Journeyed north from Wanning to Gaolong Village, Wenchang. Married Lady Yang (万州) and Lady Lin (文昌). Progenitor of the Wenchang 21-generation lineage.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 2: LONG
    // -------------------------------------------------------------
    {
      id: "gen2_long",
      name: "祝隆 (Zhu Long)",
      pinyin: "Zhù Lóng",
      gen: 2,
      genName: "2nd Generation (二世)",
      genChar: "隆",
      fatherId: "gen1_gao",
      branch: "Gaolong Village",
      location: "Gaolong Village, Wenchang",
      page: 22,
      notes: "Son of Zhu Gao and Lady Lin. Fortified and expanded the ancestral Gaolong homestead.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 3: YI
    // -------------------------------------------------------------
    {
      id: "gen3_yi",
      name: "祝裔 (Zhu Yi)",
      pinyin: "Zhù Yì",
      gen: 3,
      genName: "3rd Generation (三世)",
      genChar: "裔",
      fatherId: "gen2_long",
      branch: "Gaolong Village",
      location: "Gaolong Village, Wenchang",
      page: 22,
      notes: "Son of Zhu Long. The trunk from which the two great ancestral houses (Senior House / Junior House) split.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 4: JING (Senior Branch) & TING (Junior Branch)
    // -------------------------------------------------------------
    {
      id: "gen4_jing",
      name: "祝景 (Zhu Jing · 长房)",
      pinyin: "Zhù Jǐng",
      gen: 4,
      genName: "4th Generation · Senior Branch (四世长房)",
      genChar: "景",
      fatherId: "gen3_yi",
      branch: "Senior House (长房)",
      location: "Gaolong Village, Wenchang",
      page: 22,
      notes: "First son of Zhu Yi. Founded the Senior House of Gaolong Village, carrying the primary homestead lineage.",
      isCore: true
    },
    {
      id: "gen4_ting",
      name: "祝廷 (Zhu Ting · 次房)",
      pinyin: "Zhù Tíng",
      gen: 4,
      genName: "4th Generation · Junior Branch (四世代房)",
      genChar: "廷",
      fatherId: "gen3_yi",
      branch: "Junior House (次房)",
      location: "Gaolong & Wanning Branches",
      page: 22,
      notes: "Second son of Zhu Yi. Branch patriarch of the Junior House spanning Gaolong, Xinqiao, Penglai, and Wanning.",
      isCore: true
    },
    {
      id: "gen4_tingzhong",
      name: "祝廷忠 (Zhu Tingzhong)",
      pinyin: "Zhù Tíngzhōng",
      gen: 4,
      genName: "4th Generation (四世)",
      genChar: "廷",
      fatherId: "gen3_yi",
      branch: "Junior House (次房)",
      location: "Gaolong Village",
      page: 22,
      notes: "Brother of Zhu Jing & Zhu Ting.",
      isCore: false
    },
    {
      id: "gen4_tingyuan",
      name: "祝廷元 (Zhu Tingyuan)",
      pinyin: "Zhù Tíngyuán",
      gen: 4,
      genName: "4th Generation (四世)",
      genChar: "廷",
      fatherId: "gen3_yi",
      branch: "Junior House (次房)",
      location: "Gaolong Village",
      page: 22,
      notes: "Recorded on Page 22.",
      isCore: false
    },
    {
      id: "gen4_tingzhi",
      name: "祝廷质 (Zhu Tingzhi / 廷贵)",
      pinyin: "Zhù Tíngzhì",
      gen: 4,
      genName: "4th Generation (四世)",
      genChar: "廷",
      fatherId: "gen3_yi",
      branch: "Restored Branches #66–#82",
      location: "Gaolong & Xinqiao",
      page: 82,
      notes: "Father of Wenwang (文旺) and Wenhong (文弘). Progenitor of the restored spreads on Pages 82–83.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 5: TIAN / WEN (天 / 文)
    // -------------------------------------------------------------
    {
      id: "gen5_wenwang",
      name: "祝文旺 (Zhu Wenwang)",
      pinyin: "Zhù Wénwàng",
      gen: 5,
      genName: "5th Generation (五世)",
      genChar: "文",
      fatherId: "gen4_tingzhi",
      branch: "Restored Branch (Pages 82–83)",
      location: "Gaolong / Xinqiao",
      page: 82,
      notes: "Eldest son of Tingzhi. Father of Tianwei (天为) and Tianhua (天华).",
      isCore: true
    },
    {
      id: "gen5_wenhong",
      name: "祝文弘 (Zhu Wenhong)",
      pinyin: "Zhù Wénhóng",
      gen: 5,
      genName: "5th Generation (五世)",
      genChar: "文",
      fatherId: "gen4_tingzhi",
      branch: "Restored Branch (Pages 82–83)",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Second son of Tingzhi. Father of Tianzhong (天忠).",
      isCore: true
    },
    {
      id: "gen5_wenji",
      name: "祝文记 (Zhu Wenji)",
      pinyin: "Zhù Wénjì",
      gen: 5,
      genName: "5th Generation (五世)",
      genChar: "文",
      fatherId: "gen4_jing",
      branch: "Senior House (Gaolong)",
      location: "Gaolong Village",
      page: 25,
      notes: "Senior branch 5th-generation patriarch.",
      isCore: true
    },
    {
      id: "gen5_tianwei",
      name: "祝天为 (Zhu Tianwei)",
      pinyin: "Zhù Tiānwèi",
      gen: 5,
      genName: "5th Generation (五世)",
      genChar: "天",
      fatherId: "gen5_wenwang",
      branch: "Restored Branch (Page 82)",
      location: "Gaolong / Xinqiao",
      page: 82,
      notes: "Father of Biqi (必起), Bishou (必寿), and Biling (必龄).",
      isCore: true
    },
    {
      id: "gen5_tianhua",
      name: "祝天华 (Zhu Tianhua)",
      pinyin: "Zhù Tiānhuá",
      gen: 5,
      genName: "5th Generation (五世)",
      genChar: "天",
      fatherId: "gen5_wenwang",
      branch: "Restored Branch (Page 83)",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Brother of Tianwei. Father of Bi'en (必恩).",
      isCore: true
    },
    {
      id: "gen5_tianzhong",
      name: "祝天忠 (Zhu Tianzhong)",
      pinyin: "Zhù Tiānzhōng",
      gen: 5,
      genName: "5th Generation (五世)",
      genChar: "天",
      fatherId: "gen5_wenhong",
      branch: "Restored Branch (Page 83)",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Son of Wenhong. Father of Bihui (必慧) and Bichuan (必传).",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 6: BI (必)
    // -------------------------------------------------------------
    {
      id: "gen6_bizhong",
      name: "祝必中 (Zhu Bizhong)",
      pinyin: "Zhù Bìzhōng",
      gen: 6,
      genName: "6th Generation (六世)",
      genChar: "必",
      fatherId: "gen5_wenji",
      branch: "Senior House (Gaolong)",
      location: "Gaolong Village",
      page: 25,
      notes: "Senior House direct branch ancestor.",
      isCore: true
    },
    {
      id: "gen6_biqi",
      name: "祝必起 (Zhu Biqi)",
      pinyin: "Zhù Bìqǐ",
      gen: 6,
      genName: "6th Generation (六世)",
      genChar: "必",
      fatherId: "gen5_tianwei",
      branch: "Branch #66–#68",
      location: "Gaolong / Xinqiao",
      page: 82,
      notes: "Father of Qiushi (求仕), Qiuli (求礼), and Qiushan (求善).",
      isCore: true
    },
    {
      id: "gen6_bishou",
      name: "祝必寿 (Zhu Bishou)",
      pinyin: "Zhù Bìshòu",
      gen: 6,
      genName: "6th Generation (六世)",
      genChar: "必",
      fatherId: "gen5_tianwei",
      branch: "Branch #69",
      location: "Gaolong / Xinqiao",
      page: 82,
      notes: "Father of Qiusan (求三) ➔ Youmin (有敏).",
      isCore: false
    },
    {
      id: "gen6_biling",
      name: "祝必龄 (Zhu Biling)",
      pinyin: "Zhù Bìlíng",
      gen: 6,
      genName: "6th Generation (六世)",
      genChar: "必",
      fatherId: "gen5_tianwei",
      branch: "Branches #70–#73",
      location: "Gaolong / Xinqiao",
      page: 82,
      notes: "Father of Qiufu (求福), Qiuqi (求奇), and Qiubiao (求彪).",
      isCore: true
    },
    {
      id: "gen6_bien",
      name: "祝必恩 (Zhu Bi'en)",
      pinyin: "Zhù Bì'ēn",
      gen: 6,
      genName: "6th Generation (六世)",
      genChar: "必",
      fatherId: "gen5_tianhua",
      branch: "Branches #74–#79",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Father of Qiujue (求爵), Qiuren (求仁), Qiugao (求高), Qiupan (求攀).",
      isCore: true
    },
    {
      id: "gen6_bihui",
      name: "祝必慧 (Zhu Bihui)",
      pinyin: "Zhù Bìhuì",
      gen: 6,
      genName: "6th Generation (六世)",
      genChar: "必",
      fatherId: "gen5_tianzhong",
      branch: "Branch #80",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Father of Qiuren (求仁, adopted) ➔ Youjian (有简).",
      isCore: false
    },
    {
      id: "gen6_bichuan",
      name: "祝必传 (Zhu Bichuan)",
      pinyin: "Zhù Bìchuán",
      gen: 6,
      genName: "6th Generation (六世)",
      genChar: "必",
      fatherId: "gen5_tianzhong",
      branch: "Branches #81–#82",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Adopted as Tianzhong's heir. Father of Qiuyu (求愈) ➔ Youjing & Youneng.",
      isCore: false
    },

    // -------------------------------------------------------------
    // GENERATION 7: QIU (求)
    // -------------------------------------------------------------
    {
      id: "gen7_qiuguang",
      name: "祝求广 (Zhu Qiuguang)",
      pinyin: "Zhù Qiúguǎng",
      gen: 7,
      genName: "7th Generation (七世)",
      genChar: "求",
      fatherId: "gen6_bizhong",
      branch: "Senior House (Gaolong)",
      location: "Gaolong Village",
      page: 25,
      notes: "Senior House direct branch ancestor.",
      isCore: true
    },
    {
      id: "gen7_qiushi",
      name: "祝求仕 (Zhu Qiushi)",
      pinyin: "Zhù Qiúshì",
      gen: 7,
      genName: "7th Generation (七世)",
      genChar: "求",
      fatherId: "gen6_biqi",
      branch: "Branch #66",
      location: "Gaolong / Xinqiao",
      page: 82,
      notes: "Father of #66 Youyan (有严).",
      isCore: true
    },
    {
      id: "gen7_qiuli",
      name: "祝求礼 (Zhu Qiuli)",
      pinyin: "Zhù Qiúlǐ",
      gen: 7,
      genName: "7th Generation (七世)",
      genChar: "求",
      fatherId: "gen6_biqi",
      branch: "Branch #68",
      location: "Gaolong / Xinqiao",
      page: 82,
      notes: "Adopted branch line. Father of #68 Youyi (有翼).",
      isCore: false
    },
    {
      id: "gen7_qiushan",
      name: "祝求善 (Zhu Qiushan)",
      pinyin: "Zhù Qiúshàn",
      gen: 7,
      genName: "7th Generation (七世)",
      genChar: "求",
      fatherId: "gen6_biqi",
      branch: "Branch #67",
      location: "Gaolong / Xinqiao",
      page: 82,
      notes: "Father of #67 Youmao (有瑁).",
      isCore: false
    },
    {
      id: "gen7_qiujue",
      name: "祝求爵 (Zhu Qiujue)",
      pinyin: "Zhù Qiújué",
      gen: 7,
      genName: "7th Generation (七世)",
      genChar: "求",
      fatherId: "gen6_bien",
      branch: "Branches #74–#76",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Father of #74 Youpeng (有朋), #75 Youxin (有信), #76 Youjue (有觉).",
      isCore: true
    },
    {
      id: "gen7_qiupan",
      name: "祝求攀 (Zhu Qiupan)",
      pinyin: "Zhù Qiúpān",
      gen: 7,
      genName: "7th Generation (七世)",
      genChar: "求",
      fatherId: "gen6_bien",
      branch: "Branches #78–#79",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Father of #78 Yougong (有恭), #79 Youjian (有简), and Youdeng (有登).",
      isCore: false
    },

    // -------------------------------------------------------------
    // GENERATION 8: YOU (有)
    // -------------------------------------------------------------
    {
      id: "gen8_youkui",
      name: "祝有魁 (Zhu Youkui)",
      pinyin: "Zhù Yǒukuí",
      gen: 8,
      genName: "8th Generation (八世)",
      genChar: "有",
      fatherId: "gen7_qiuguang",
      branch: "Senior House (Gaolong)",
      location: "Gaolong Village",
      page: 25,
      notes: "Senior House direct branch ancestor.",
      isCore: true
    },
    {
      id: "gen8_youyan",
      name: "祝有严 (#66 Youyan)",
      pinyin: "Zhù Yǒuyán",
      gen: 8,
      genName: "8th Generation (八世)",
      genChar: "有",
      fatherId: "gen7_qiushi",
      branch: "Restored Branch #66 (Page 82)",
      location: "Xinqiao / Gaolong",
      page: 82,
      notes: "Designated Lineage Branch #66 on Page 82.",
      isCore: true
    },
    {
      id: "gen8_youmao",
      name: "祝有瑁 (#67 Youmao)",
      pinyin: "Zhù Yǒumào",
      gen: 8,
      genName: "8th Generation (八世)",
      genChar: "有",
      fatherId: "gen7_qiushan",
      branch: "Restored Branch #67 (Page 82)",
      location: "Xinqiao / Gaolong",
      page: 82,
      notes: "Designated Lineage Branch #67 on Page 82 (Lineage ended).",
      isCore: false
    },
    {
      id: "gen8_youyi",
      name: "祝有翼 (#68 Youyi)",
      pinyin: "Zhù Yǒuyì",
      gen: 8,
      genName: "8th Generation (八世)",
      genChar: "有",
      fatherId: "gen7_qiuli",
      branch: "Restored Branch #68 (Page 82)",
      location: "Xinqiao / Gaolong",
      page: 82,
      notes: "Designated Lineage Branch #68 on Page 82.",
      isCore: false
    },
    {
      id: "gen8_youpeng",
      name: "祝有朋 (#74 Youpeng)",
      pinyin: "Zhù Yǒupéng",
      gen: 8,
      genName: "8th Generation (八世)",
      genChar: "有",
      fatherId: "gen7_qiujue",
      branch: "Restored Branch #74 (Page 83)",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Designated Lineage Branch #74 on Page 83.",
      isCore: true
    },
    {
      id: "gen8_youjue",
      name: "祝有觉 (#76 Youjue)",
      pinyin: "Zhù Yǒujué",
      gen: 8,
      genName: "8th Generation (八世)",
      genChar: "有",
      fatherId: "gen7_qiujue",
      branch: "Restored Branch #76 (Page 83)",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Designated Lineage Branch #76 on Page 83.",
      isCore: false
    },
    {
      id: "gen8_youneng",
      name: "祝有能 (#82 Youneng)",
      pinyin: "Zhù Yǒunéng",
      gen: 8,
      genName: "8th Generation (八世)",
      genChar: "有",
      fatherId: "gen6_bichuan",
      branch: "Restored Branch #82 (Page 83)",
      location: "Gaolong / Xinqiao",
      page: 83,
      notes: "Designated Lineage Branch #82 concluding the restored spread on Page 83.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATIONS 9–13: CHUAN, JI, ZHEN, XING, SHENG (传 继 振 兴 声)
    // -------------------------------------------------------------
    {
      id: "gen9_chuan",
      name: "祝传业 (Zhu Chuanye)",
      pinyin: "Zhù Chuányè",
      gen: 9,
      genName: "9th Generation (九世)",
      genChar: "传",
      fatherId: "gen8_youkui",
      branch: "Senior House (Gaolong)",
      location: "Gaolong Village",
      page: 28,
      notes: "Senior branch 9th-generation patriarch.",
      isCore: true
    },
    {
      id: "gen10_ji",
      name: "祝继贤 (Zhu Jixian)",
      pinyin: "Zhù Jìxián",
      gen: 10,
      genName: "10th Generation (十世)",
      genChar: "继",
      fatherId: "gen9_chuan",
      branch: "Senior House (Gaolong)",
      location: "Gaolong Village",
      page: 28,
      notes: "Senior branch 10th-generation patriarch.",
      isCore: true
    },
    {
      id: "gen11_zhen",
      name: "祝振储 (Zhu Zhenchu)",
      pinyin: "Zhù Zhènchǔ",
      gen: 11,
      genName: "11th Generation (十一世)",
      genChar: "振",
      fatherId: "gen10_ji",
      branch: "Senior House (Gaolong)",
      location: "Gaolong Village",
      page: 28,
      notes: "Senior branch 11th-generation patriarch.",
      isCore: true
    },
    {
      id: "gen12_xing",
      name: "祝兴从 (Zhu Xingcong)",
      pinyin: "Zhù Xīngcóng",
      gen: 12,
      genName: "12th Generation (十二世)",
      genChar: "兴",
      fatherId: "gen11_zhen",
      branch: "Senior House (Gaolong)",
      location: "Gaolong Village",
      page: 28,
      notes: "Gaolong village 12th-generation elder.",
      isCore: true
    },
    {
      id: "gen13_sheng",
      name: "祝声焕 (Zhu Shenghuan)",
      pinyin: "Zhù Shēnghuàn",
      gen: 13,
      genName: "13th Generation (十三世)",
      genChar: "声",
      fatherId: "gen12_xing",
      branch: "Senior House (Gaolong)",
      location: "Gaolong Village",
      page: 28,
      notes: "Direct ancestor of the Gaolong contemporary branch.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 14: XING (兴) — THE 1895 PACT ERA
    // -------------------------------------------------------------
    {
      id: "gen14_xinchuan",
      name: "祝心传 (Zhu Xinchuan / 兴渡)",
      pinyin: "Zhù Xīnchuán",
      gen: 14,
      genName: "14th Generation (十四世)",
      genChar: "兴",
      fatherId: "gen13_sheng",
      branch: "Gaolong Scholar Line",
      location: "Gaolong Village, Wenchang",
      page: 15,
      notes: "Imperial Scholar (贡生) and revered educator. Authored the landmark 'Joint Lineage Preface' (祝氏联谱序) in Autumn 1895 (Guangxu 21st Year), eternally uniting Wanning and Wenchang branches.",
      isCore: true
    },
    {
      id: "gen14_xingjin",
      name: "祝兴锦 (Zhu Xingjin)",
      pinyin: "Zhù Xīngjǐn",
      gen: 14,
      genName: "14th Generation (十四世)",
      genChar: "兴",
      fatherId: "gen13_sheng",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 28,
      notes: "Brother of Zhu Xinchuan's generation.",
      isCore: false
    },

    // -------------------------------------------------------------
    // GENERATION 15: SHENG (声) — THE SOUTHEAST ASIA DIASPORA
    // -------------------------------------------------------------
    {
      id: "gen15_shengtang",
      name: "祝声堂 (Zhu Shengtang)",
      pinyin: "Zhù Shēngtáng",
      gen: 15,
      genName: "15th Generation (十五世)",
      genChar: "声",
      fatherId: "gen14_xinchuan",
      branch: "Penglai Dashan Branch (蓬莱大山村)",
      location: "Dashan Village, Penglai, Wenchang",
      page: 5,
      notes: "Patriarch who preserved the hand-copied ancient genealogy manuscripts in Penglai town.",
      isCore: true
    },
    {
      id: "gen15_shengbiao",
      name: "祝声标 (Zhu Shengbiao)",
      pinyin: "Zhù Shēngbiāo",
      gen: 15,
      genName: "15th Generation (十五世)",
      genChar: "声",
      fatherId: "gen14_xinchuan",
      branch: "Gaolong Direct Line",
      location: "Gaolong Village",
      page: 41,
      notes: "Father of Chaojin (朝金) & Chaoying (朝英). Direct ancestral trunk for Mingcan's house.",
      isCore: true
    },
    {
      id: "gen15_shengpei",
      name: "祝声培 (Zhu Shengpei)",
      pinyin: "Zhù Shēngpéi",
      gen: 15,
      genName: "15th Generation (十五世)",
      genChar: "声",
      fatherId: "gen14_xinchuan",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 15,
      notes: "Son of Zhu Xinchuan (Kuangyong Gong / 况雍公).",
      isCore: false
    },
    {
      id: "gen15_shengguan",
      name: "祝声宦 (Zhu Shengguan)",
      pinyin: "Zhù Shēnghuàn",
      gen: 15,
      genName: "15th Generation (十五世)",
      genChar: "声",
      fatherId: "gen14_xinchuan",
      branch: "Overseas Branch (Nanyang)",
      location: "Gaolong ➔ Southeast Asia",
      page: 44,
      notes: "Pioneered early trade routes to British Malaya and Singapore.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 16: CHAO (朝) — THE RESTORATION ERA
    // -------------------------------------------------------------
    {
      id: "gen16_zhaoke",
      name: "祝朝克 (Zhu Zhaoke)",
      pinyin: "Zhù Zháokè",
      gen: 16,
      genName: "16th Generation · Lineage Author (十六世)",
      genChar: "朝",
      fatherId: "gen15_shengtang",
      branch: "Gaolong Branch / Haikou",
      location: "Gaolong Village ➔ Haikou (海口)",
      page: 8,
      notes: "Lineage compiler and author of the 2007 96-page authoritative book. Spent 5 seasons (2003–2007) traveling across 20+ villages to preserve ancestral records.",
      isCore: true
    },
    {
      id: "gen16_zhaoxu",
      name: "祝朝徐 (Zhu Zhaoxu)",
      pinyin: "Zhù Zháoxù",
      gen: 16,
      genName: "16th Generation · Clan Elder (十六世)",
      genChar: "朝",
      fatherId: "gen15_shengtang",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 8,
      notes: "Octogenarian clan elder who provided ancestral records, guided island-wide fieldwork, and reviewed the lineage drafts.",
      isCore: true
    },
    {
      id: "gen16_zhaojin",
      name: "祝朝金 (Zhu Zhaojin)",
      pinyin: "Zhù Zháojīn",
      gen: 16,
      genName: "16th Generation (十六世)",
      genChar: "朝",
      fatherId: "gen15_shengbiao",
      branch: "Gaolong Direct Line",
      location: "Gaolong Village",
      page: 41,
      notes: "Eldest son of Shengbiao. Direct ancestor of Shengjin and Mingcan.",
      isCore: true
    },
    {
      id: "gen16_zhaoying",
      name: "祝朝英 (Zhu Zhaoying)",
      pinyin: "Zhù Zháoyīng",
      gen: 16,
      genName: "16th Generation (十六世)",
      genChar: "朝",
      fatherId: "gen15_shengbiao",
      branch: "Gaolong Branch",
      location: "Gaolong Village",
      page: 41,
      notes: "Brother of Zhaojin. Father of Jiaxi (家喜).",
      isCore: false
    },
    {
      id: "gen16_zhaoyu",
      name: "祝朝昱 (Zhu Zhaoyu)",
      pinyin: "Zhù Zháoyù",
      gen: 16,
      genName: "16th Generation (十六世)",
      genChar: "朝",
      fatherId: "gen15_shengguan",
      branch: "Overseas Branch (Singapore / Malaysia)",
      location: "Singapore / Taiping, Perak, Malaysia",
      page: 44,
      notes: "Overseas branch patriarch documented on Page 44.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 17: JIA (家) — GRANDFATHERS' GENERATION
    // -------------------------------------------------------------
    {
      id: "gen17_jiameng",
      name: "祝家孟 (Zhu Jiameng / 朝孟)",
      pinyin: "Zhù Jiāmèng",
      gen: 17,
      genName: "17th Generation (十七世)",
      genChar: "家",
      fatherId: "gen16_zhaoke",
      branch: "Gaolong Lineage Committee",
      location: "Gaolong Village",
      page: 20,
      notes: "Senior editor who assisted Zhu Zhaoke in organizing the 2007 genealogy.",
      isCore: true
    },
    {
      id: "gen17_jiazhi",
      name: "祝家志 (Zhu Jiazhi)",
      pinyin: "Zhù Jiāzhì",
      gen: 17,
      genName: "17th Generation (十七世)",
      genChar: "家",
      fatherId: "gen16_zhaojin",
      branch: "Gaolong Direct Line",
      location: "Gaolong Village",
      page: 41,
      notes: "Grandfather of Mingcan (明灿). Father of Shengjin (圣进) & Shengli (圣利).",
      isCore: true
    },
    {
      id: "gen17_jiaxi",
      name: "祝家喜 (Zhu Jiaxi)",
      pinyin: "Zhù Jiāxǐ",
      gen: 17,
      genName: "17th Generation (十七世)",
      genChar: "家",
      fatherId: "gen16_zhaoying",
      branch: "Gaolong Branch",
      location: "Gaolong Village",
      page: 41,
      notes: "Father of Shengchan (圣谗).",
      isCore: false
    },
    {
      id: "gen17_jiasong",
      name: "祝家松 (Zhu Jiasong)",
      pinyin: "Zhù Jiāsōng",
      gen: 17,
      genName: "17th Generation · Singapore (十七世)",
      genChar: "家",
      fatherId: "gen16_zhaoyu",
      branch: "Singapore Branch (新加坡)",
      location: "Singapore (Jianhua Shop / 建华店)",
      page: 44,
      notes: "Established family trading company 'Jianhua Shop' in Singapore; actively maintained correspondence with Hainan homeland.",
      isCore: true
    },
    {
      id: "gen17_jiaquan",
      name: "祝家全 (Zhu Jiaquan)",
      pinyin: "Zhù Jiāquán",
      gen: 17,
      genName: "17th Generation · Malaysia (十七世)",
      genChar: "家",
      fatherId: "gen16_zhaoyu",
      branch: "Malaysia Branch (马来西亚)",
      location: "Taiping, Perak, Malaysia (马来西亚太平)",
      page: 44,
      notes: "Settled in Taiping, Perak, Malaysia; established prominent Malaysian branch documented on Page 44.",
      isCore: true
    },
    {
      id: "gen17_jiachang",
      name: "祝家昌 (Zhu Jiachang)",
      pinyin: "Zhù Jiāchāng",
      gen: 17,
      genName: "17th Generation (十七世)",
      genChar: "家",
      fatherId: "gen16_zhaojin",
      branch: "Gaolong Branch",
      location: "Gaolong Village",
      page: 41,
      notes: "Father of Junjuan (俊娟), Junying (俊英), Junmei (俊梅).",
      isCore: false
    },

    // -------------------------------------------------------------
    // GENERATION 18: SHENG (圣) — FATHERS' GENERATION
    // -------------------------------------------------------------
    {
      id: "gen18_shengjin",
      name: "祝圣进 (Zhu Shengjin)",
      pinyin: "Zhù Shèngjìn",
      gen: 18,
      genName: "18th Generation · Father (十八世)",
      genChar: "圣",
      fatherId: "gen17_jiazhi",
      branch: "Gaolong Direct Line",
      location: "Gaolong Village, Wenchang",
      page: 44,
      notes: "Father of Mingcan (明灿), Mingwei (明威), Mingcheng (明成). Respected patriarch of the 18th generation directly preceding the contemporary house.",
      isCore: true
    },
    {
      id: "gen18_shengli",
      name: "祝圣利 (Zhu Shengli)",
      pinyin: "Zhù Shènglì",
      gen: 18,
      genName: "18th Generation (十八世)",
      genChar: "圣",
      fatherId: "gen17_jiazhi",
      branch: "Malaysia / Gaolong Branch",
      location: "Malaysia / Gaolong",
      page: 44,
      notes: "Brother of Shengjin; father of Mingjian (明建) & Mingtai (明太).",
      isCore: true
    },
    {
      id: "gen18_shengge",
      name: "祝圣阁 (Zhu Shengge)",
      pinyin: "Zhù Shènggé",
      gen: 18,
      genName: "18th Generation (十八世)",
      genChar: "圣",
      fatherId: "gen17_jiameng",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 40,
      notes: "Father of Mingben (明本) & Mingbing (明炳).",
      isCore: false
    },
    {
      id: "gen18_shengfu",
      name: "祝圣福 (Zhu Shengfu)",
      pinyin: "Zhù Shèngfú",
      gen: 18,
      genName: "18th Generation (十八世)",
      genChar: "圣",
      fatherId: "gen17_jiazhi",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 43,
      notes: "Father of Mingji (明基).",
      isCore: false
    },
    {
      id: "gen18_shengbao",
      name: "祝圣保 (Zhu Shengbao)",
      pinyin: "Zhù Shèngbǎo",
      gen: 18,
      genName: "18th Generation (十八世)",
      genChar: "圣",
      fatherId: "gen17_jiazhi",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 43,
      notes: "Father of Mingjie (明杰).",
      isCore: false
    },
    {
      id: "gen18_shengming",
      name: "祝圣明 (Zhu Shengming)",
      pinyin: "Zhù Shèngmíng",
      gen: 18,
      genName: "18th Generation · Revolutionary Martyr (十八世)",
      genChar: "圣",
      fatherId: "gen17_jiameng",
      branch: "Gaolong Revolutionary Line",
      location: "Gaolong Village",
      page: 54,
      notes: "Revolutionary martyr (原名更夫) honored in official county registry for wartime sacrifice.",
      isCore: true
    },

    // -------------------------------------------------------------
    // GENERATION 19: MING / MING (明 / 铭) — YOUR GENERATION!
    // -------------------------------------------------------------
    {
      id: "gen19_mingcan",
      name: "祝明灿 (Ts. Dr. Timothy Tok / 铭灿)",
      pinyin: "Zhù Míngcàn",
      gen: 19,
      genName: "19th Generation · Current Generation (十九世 · 明字辈)",
      genChar: "明",
      spouse: "廖蕙芬 (Liao Huifen)",
      fatherId: "gen18_shengjin",
      branch: "Gaolong Direct Line (清澜高隆长房)",
      location: "Kuala Lumpur, Malaysia / Global",
      page: 44,
      notes: "19th Generation torchbearer and clan digital architect recorded on Pages 44–45. First son of Zhu Shengjin. Married to 廖蕙芬 (Liao Huifen). Father of 祝运凌 (Zhu Yunling) and 祝运翔 (Zhu Yunxiang).",
      isCore: true,
      isCurrentUser: true
    },
    {
      id: "gen19_mingwei",
      name: "祝明威 (Zhu Mingwei)",
      pinyin: "Zhù Míngwēi",
      gen: 19,
      genName: "19th Generation · Generational Brother (十九世)",
      genChar: "明",
      fatherId: "gen18_shengjin",
      branch: "Gaolong Direct Line",
      location: "Gaolong Village",
      page: 44,
      notes: "Son of Zhu Shengjin; brother of Zhu Mingcan.",
      isCore: true
    },
    {
      id: "gen19_mingcheng",
      name: "祝明成 (Zhu Mingcheng)",
      pinyin: "Zhù Míngchéng",
      gen: 19,
      genName: "19th Generation · Generational Brother (十九世)",
      genChar: "明",
      fatherId: "gen18_shengjin",
      branch: "Gaolong Direct Line",
      location: "Gaolong Village",
      page: 44,
      notes: "Son of Zhu Shengjin; brother of Zhu Mingcan.",
      isCore: true
    },
    {
      id: "gen19_mingjian",
      name: "祝明建 (Zhu Mingjian)",
      pinyin: "Zhù Míngjiàn",
      gen: 19,
      genName: "19th Generation · Cousin (十九世)",
      genChar: "明",
      fatherId: "gen18_shengli",
      branch: "Malaysia / Gaolong Branch",
      location: "Malaysia / Gaolong",
      page: 44,
      notes: "Son of Zhu Shengli; first cousin of Zhu Mingcan.",
      isCore: true
    },
    {
      id: "gen19_mingtai",
      name: "祝明太 (Zhu Mingtai)",
      pinyin: "Zhù Míngtài",
      gen: 19,
      genName: "19th Generation · Cousin (十九世)",
      genChar: "明",
      fatherId: "gen18_shengli",
      branch: "Malaysia / Gaolong Branch",
      location: "Malaysia / Gaolong",
      page: 44,
      notes: "Son of Zhu Shengli; first cousin of Zhu Mingcan.",
      isCore: false
    },
    {
      id: "gen19_mingben",
      name: "祝明本 (Zhu Mingben)",
      pinyin: "Zhù Míngběn",
      gen: 19,
      genName: "19th Generation (十九世)",
      genChar: "明",
      fatherId: "gen18_shengge",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 40,
      notes: "Son of Zhu Shengge; father of Yunneng (运能).",
      isCore: false
    },
    {
      id: "gen19_mingbing",
      name: "祝明炳 (Zhu Mingbing)",
      pinyin: "Zhù Míngbǐng",
      gen: 19,
      genName: "19th Generation (十九世)",
      genChar: "明",
      fatherId: "gen18_shengge",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 40,
      notes: "Son of Zhu Shengge.",
      isCore: false
    },
    {
      id: "gen19_mingjie",
      name: "祝明杰 (Zhu Mingjie)",
      pinyin: "Zhù Míngjié",
      gen: 19,
      genName: "19th Generation (十九世)",
      genChar: "明",
      fatherId: "gen18_shengbao",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 43,
      notes: "Son of Zhu Shengbao.",
      isCore: false
    },

    // -------------------------------------------------------------
    // GENERATION 20: YUN (运) — YOUR CHILDREN'S GENERATION
    // -------------------------------------------------------------
    {
      id: "gen20_yunneng",
      name: "祝运能 (Zhu Yunneng)",
      pinyin: "Zhù Yùnnéng",
      gen: 20,
      genName: "20th Generation · Descendants (二十世)",
      genChar: "运",
      fatherId: "gen19_mingben",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 40,
      notes: "Son of Zhu Mingben; father of Jisheng (际胜).",
      isCore: true
    },
    {
      id: "gen20_yunling",
      name: "祝运凌 (Zhu Yunling)",
      pinyin: "Zhù Yùnlíng",
      gen: 20,
      genName: "20th Generation · Yun Generation (二十世 · 运字辈)",
      genChar: "运",
      fatherId: "gen19_mingcan",
      mother: "廖蕙芬 (Liao Huifen)",
      branch: "Gaolong Direct Line (清澜高隆长房)",
      location: "Kuala Lumpur, Malaysia / Global",
      page: 44,
      notes: "First child of Ts. Dr. 祝明灿 (Timothy Tok) and 廖蕙芬 (Liao Huifen). 20th Generation carrying the sacred lineage code 'Yun' (运际昌期).",
      isCore: true
    },
    {
      id: "gen20_yunxiang",
      name: "祝运翔 (Zhu Yunxiang)",
      pinyin: "Zhù Yùnxiáng",
      gen: 20,
      genName: "20th Generation · Yun Generation (二十世 · 运字辈)",
      genChar: "运",
      fatherId: "gen19_mingcan",
      mother: "廖蕙芬 (Liao Huifen)",
      branch: "Gaolong Direct Line (清澜高隆长房)",
      location: "Kuala Lumpur, Malaysia / Global",
      page: 44,
      notes: "Child of Ts. Dr. 祝明灿 (Timothy Tok) and 廖蕙芬 (Liao Huifen). 20th Generation carrying the sacred lineage code 'Yun' (运际昌期).",
      isCore: true
    },
    {
      id: "gen20_yunfu",
      name: "祝运福 (Zhu Yunfu)",
      pinyin: "Zhù Yùnfú",
      gen: 20,
      genName: "20th Generation (二十世)",
      genChar: "运",
      fatherId: "gen19_mingwei",
      branch: "Gaolong Direct Line",
      location: "Gaolong Village",
      page: 44,
      notes: "Son of Zhu Mingwei.",
      isCore: false
    },
    {
      id: "gen20_yunfa",
      name: "祝运发 (Zhu Yunfa)",
      pinyin: "Zhù Yùnfā",
      gen: 20,
      genName: "20th Generation (二十世)",
      genChar: "运",
      fatherId: "gen19_mingcheng",
      branch: "Gaolong Direct Line",
      location: "Gaolong Village",
      page: 44,
      notes: "Son of Zhu Mingcheng.",
      isCore: false
    },

    // -------------------------------------------------------------
    // GENERATION 21: JI (际)
    // -------------------------------------------------------------
    {
      id: "gen21_jisheng",
      name: "祝际胜 (Zhu Jisheng / 培为)",
      pinyin: "Zhù Jìshèng",
      gen: 21,
      genName: "21st Generation · 21st Century Successor (廿一世)",
      genChar: "际",
      fatherId: "gen20_yunneng",
      branch: "Gaolong Village",
      location: "Gaolong Village",
      page: 40,
      notes: "Recorded on Page 40 of the 2007 book, carrying the torch into the 21st generation.",
      isCore: true
    }
  ];

  // Helper index maps
  const nodeMap = new Map();
  treeNodes.forEach(node => {
    node.childrenIds = [];
    nodeMap.set(node.id, node);
  });

  // Populate childrenIds
  treeNodes.forEach(node => {
    if (node.fatherId && nodeMap.has(node.fatherId)) {
      nodeMap.get(node.fatherId).childrenIds.push(node.id);
    }
  });

  window.FAMILY_TREE_DATA = {
    title: "海南文昌祝氏家族世系网络与族谱树",
    englishTitle: "Hainan Wenchang Zhu Family Lineage Tree & Network",
    totalMembers: treeNodes.length,
    defaultHubId: "gen19_mingcan",
    foundingAncestorId: "gen1_gao",
    nodes: treeNodes,
    getNodeById: function(id) {
      return nodeMap.get(id) || null;
    },
    getAncestors: function(id) {
      const path = [];
      let cur = nodeMap.get(id);
      while (cur) {
        path.push(cur);
        cur = cur.fatherId ? nodeMap.get(cur.fatherId) : null;
      }
      return path.reverse();
    },
    getChildren: function(id) {
      const node = nodeMap.get(id);
      if (!node) return [];
      return node.childrenIds.map(cid => nodeMap.get(cid)).filter(Boolean);
    },
    getBrothers: function(id) {
      const node = nodeMap.get(id);
      if (!node || !node.fatherId) return [];
      const father = nodeMap.get(node.fatherId);
      if (!father) return [];
      return father.childrenIds
        .filter(cid => cid !== id)
        .map(cid => nodeMap.get(cid))
        .filter(Boolean);
    },
    getGenerationalPeers: function(id) {
      const node = nodeMap.get(id);
      if (!node) return [];
      return treeNodes.filter(n => n.gen === node.gen && n.id !== id);
    }
  };
})();
