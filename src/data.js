/* 827 数据结构 · 知识点网数据
   nodes: id 唯一；ch 章节；note 一句话考点；years 真题年份；figs 图卡；hot 高频 */
window.DS_DATA = {
  chapters: [
    { id: "c1", name: "绪论" }, { id: "c2", name: "线性表" }, { id: "c3", name: "栈与队列" },
    { id: "c4", name: "串" }, { id: "c5", name: "数组与广义表" }, { id: "c6", name: "树与二叉树" },
    { id: "c7", name: "图" }, { id: "c8", name: "查找" }, { id: "c9", name: "排序" }
  ],
  nodes: [
    { id: "adt", label: "数据结构三要素", ch: "c1", note: "逻辑结构、存储结构、运算。判断题爱考这两者不是一回事。", cx: "—" },
    { id: "complexity", label: "时间复杂度", ch: "c1", note: "数最深层语句执行次数，只留最高阶、去系数。", hot: true },
    { id: "space", label: "空间复杂度", ch: "c1", note: "只算辅助空间，递归的栈深度也要算进去。" },
    { id: "bigo", label: "大 O 表示法", ch: "c1", note: "O(1)<O(logn)<O(n)<O(nlogn)<O(n²)<O(2ⁿ)。" },

    { id: "list", label: "线性表", ch: "c2", note: "同类型元素有限序列，除首尾外一前一后。", cx: "取决于存储结构" },
    { id: "seqlist", label: "顺序表", ch: "c2", note: "数组存储，随机访问 O(1)，插删要挪元素。", cx: "取值 O(1) · 插删 O(n)" },
    { id: "insertdel", label: "顺序表插入删除", ch: "c2", note: "平均移动 n/2 与 (n-1)/2 次，结论要背。", cx: "时间 O(n) · 空间 O(1)" },
    { id: "linklist", label: "单链表", ch: "c2", note: "指针链接，插删 O(1)，但找第 i 个要 O(n)。", hot: true, cx: "查找 O(n) · 插删 O(1)" },
    { id: "reverse", label: "单链表逆置", ch: "c2", note: "头插法四步，先存后继再断链，O(n)/O(1)。", cx: "时间 O(n) · 空间 O(1)" },
    { id: "dlink", label: "双链表", ch: "c2", note: "两个指针，插入删除要改四个指针，别漏。", cx: "插删 O(1) · 查找 O(n)" },
    { id: "clink", label: "循环链表", ch: "c2", note: "尾结点指回头结点，判空 head->next == head。", cx: "查找 O(n) · 插删 O(1)" },
    { id: "staticlist", label: "静态链表", ch: "c2", note: "数组模拟指针，next 存的是下标。", cx: "插删 O(1) · 查找 O(n)" },

    { id: "stack", label: "栈", ch: "c3", note: "后进先出，只在栈顶操作，入栈出栈都是 O(1)。", cx: "入栈出栈 O(1) · 空间 O(n)" },
    { id: "brackets", label: "括号匹配", ch: "c3", note: "左括号入栈，右括号与栈顶比对，最后栈空才合法。", cx: "时间 O(n) · 空间 O(n)" },
    { id: "infix2post", label: "中缀转后缀", ch: "c3", note: "运算符栈，来的优先级低就把栈里高的弹出去。" , cx: "时间 O(n) · 空间 O(n)"},
    { id: "queue", label: "队列", ch: "c3", note: "先进先出，队尾入、队头出。", cx: "入队出队 O(1) · 空间 O(n)" },
    { id: "cqueue", label: "循环队列", ch: "c3", note: "判空 front==rear，判满 (rear+1)%M==front，留一个空位。", hot: true, cx: "入队出队 O(1) · 空间 O(M)" },
    { id: "recursion", label: "递归", ch: "c3", note: "递归工作栈，深度决定空间复杂度。", cx: "时间看递归次数 · 空间 O(深度)" },

    { id: "string", label: "串", ch: "c4", note: "字符的有限序列，重点是模式匹配。", cx: "取决于匹配算法" },
    { id: "naive", label: "朴素匹配", ch: "c4", note: "主串回溯，最坏 O(n*m)。", cx: "时间 O(n·m) · 空间 O(1)" },
    { id: "kmp", label: "KMP", ch: "c4", note: "主串指针不回溯，靠 next 决定模式串退到哪。", figs: "kmp", cx: "时间 O(n+m) · 空间 O(m)" },
    { id: "nextarr", label: "next 数组", ch: "c4", note: "next[j] = 前 j-1 个字符的最长相等前后缀长度 +1。", hot: true, figs: "kmp", cx: "时间 O(m) · 空间 O(m)" },

    { id: "array", label: "多维数组", ch: "c5", note: "行优先 / 列优先，考地址计算公式。", cx: "按地址公式 O(1) 定位" },
    { id: "compress", label: "特殊矩阵压缩", ch: "c5", note: "对称矩阵只存下三角，共 n(n+1)/2 个元素。", cx: "空间 O(n(n+1)/2)" },
    { id: "sparse", label: "稀疏矩阵", ch: "c5", note: "三元组表或十字链表，省空间但失去随机访问。", cx: "空间 O(非零元个数)" },
    { id: "glist", label: "广义表", ch: "c5", note: "表头表尾递归定义，深度和长度是两回事。", cx: "—" },

    { id: "btree", label: "二叉树", ch: "c6", note: "每结点至多两棵子树，且有左右之分，不能随便换。", cx: "查找 O(log n)" },
    { id: "btreeprop", label: "二叉树性质", ch: "c6", note: "n0 = n2 + 1；第 i 层最多 2^(i-1)；高 h 最多 2^h-1。", hot: true, cx: "—" },
    { id: "fulltree", label: "完全二叉树", ch: "c6", note: "按层序编号，i 的孩子是 2i 和 2i+1，父是 ⌊i/2⌋。", cx: "—" },
    { id: "traversal", label: "二叉树遍历", ch: "c6", note: "先序根左右、中序左根右、后序左右根。", hot: true, cx: "时间 O(n) · 空间 O(树高)" },
    { id: "levelorder", label: "层序遍历", ch: "c6", note: "借一个队列，出队时把孩子入队。", cx: "时间 O(n) · 空间 O(n)" },
    { id: "reconstruct", label: "由遍历还原", ch: "c6", note: "先序定根、中序劈两半；先序+后序不唯一。", hot: true, years: [18, 19, 20, 21, 23, 24, 25], cx: "时间 O(n) · 空间 O(n)" },
    { id: "thread", label: "线索二叉树", ch: "c6", note: "空指针指向前驱后继，中序线索最常考。", cx: "时间 O(n) · 空间 O(n)" },
    { id: "forest", label: "树与森林", ch: "c6", note: "孩子兄弟表示法转成二叉树，左孩子右兄弟。", cx: "时间 O(n)" },
    { id: "huffman", label: "哈夫曼树", ch: "c6", note: "每次合并两个最小权值，WPL 最小。", hot: true, years: [14, 18, 20, 22, 23, 24, 25], cx: "时间 O(nlog n) · 空间 O(n)" },
    { id: "huffcode", label: "哈夫曼编码", ch: "c6", note: "左 0 右 1，是前缀码，解码无二义。", cx: "时间 O(n)" },
    { id: "unionfind", label: "并查集", ch: "c6", note: "只关心属于哪个集合，路径压缩后接近 O(1)。", cx: "近似 O(1)" },

    { id: "graph", label: "图", ch: "c7", note: "顶点集加边集，注意度、连通分量、生成树。", cx: "—" },
    { id: "adjmatrix", label: "邻接矩阵", ch: "c7", note: "O(n²) 空间，判断两点相邻 O(1)，适合稠密图。", cx: "空间 O(n²)" },
    { id: "adjlist", label: "邻接表", ch: "c7", note: "稀疏图省空间；出度好求，入度难求。", cx: "空间 O(n+e)" },
    { id: "dfs", label: "DFS", ch: "c7", note: "栈或递归，一条路走到黑再回退。", cx: "时间 O(n+e) · 空间 O(n)" },
    { id: "bfs", label: "BFS", ch: "c7", note: "队列按层扩展，无权图最短路就是它。", cx: "时间 O(n+e) · 空间 O(n)" },
    { id: "mst", label: "最小生成树", ch: "c7", note: "n 个顶点取 n-1 条边，权值和最小。", cx: "Prim O(n²) · Kruskal O(e·log e)" },
    { id: "prim", label: "Prim", ch: "c7", note: "从点集往外扩，适合稠密图，O(n²)。", cx: "时间 O(n²) · 空间 O(n)" },
    { id: "kruskal", label: "Kruskal", ch: "c7", note: "边排序 + 并查集判环，适合稀疏图。", cx: "时间 O(e·log e) · 空间 O(n)" },
    { id: "dijkstra", label: "Dijkstra", ch: "c7", note: "逐点标号，挑最小未确定的点松弛；不能有负权边。", hot: true, years: [10, 18, 19, 20, 21, 23, 24], cx: "时间 O(n²) · 空间 O(n)" },
    { id: "floyd", label: "Floyd", ch: "c7", note: "三重循环求任意两点最短路，O(n³)，能处理负权。", cx: "时间 O(n³) · 空间 O(n²)" },
    { id: "topo", label: "拓扑排序", ch: "c7", note: "AOV 网，反复摘掉入度为 0 的点。", cx: "时间 O(n+e) · 空间 O(n)" },
    { id: "aoe", label: "AOE 关键路径", ch: "c7", note: "ve 与 vl 相等的活动是关键活动，决定总工期。", hot: true, figs: "aoe", years: [17, 20, 23, 24], cx: "时间 O(n+e) · 空间 O(n)" },

    { id: "search", label: "查找", ch: "c8", note: "核心指标是平均查找长度 ASL。", cx: "—" },
    { id: "seqsearch", label: "顺序查找", ch: "c8", note: "ASL = (n+1)/2，有序时可以提前停。", cx: "时间 O(n) · 空间 O(1)" },
    { id: "binsearch", label: "折半查找", ch: "c8", note: "必须有序；判定树高 ⌊log₂n⌋+1，最多比这么多次。", hot: true, cx: "时间 O(log n) · 空间 O(1)" },
    { id: "blocksearch", label: "分块查找", ch: "c8", note: "索引表 + 块内顺序，块间有序块内无序。", cx: "时间 O(√n)" },
    { id: "bst", label: "二叉排序树", ch: "c8", note: "中序有序；插删平均 O(logn)，最坏退化成链表。", cx: "平均 O(log n) · 最坏 O(n)" },
    { id: "avl", label: "AVL 树", ch: "c8", note: "平衡因子 |BF| ≤ 1，四种旋转：LL/RR/LR/RL。", hot: true, figs: "avl", years: [19, 22, 23, 25], cx: "查找/插删 O(log n)" },
    { id: "btreeb", label: "B 树", ch: "c8", note: "多路平衡查找树，结点大小对齐磁盘块。", cx: "查找 O(log n)" },
    { id: "hash", label: "散列表", ch: "c8", note: "由关键字直接算地址，冲突不可避免。", hot: true, freq: "11–25 每年", cx: "平均 O(1) · 最坏 O(n)" },
    { id: "hashprob", label: "冲突处理", ch: "c8", note: "线性探测、二次探测、链地址法。", cx: "查找长度取决于装填因子 α" },
    { id: "asl", label: "ASL 计算", ch: "c8", note: "成功和失败的分母不一样，这是最常见的错。", hot: true, freq: "11–25 每年", cx: "—" },

    { id: "sort", label: "排序", ch: "c9", note: "时间、空间、稳定性三个维度一起看。", cx: "—" },
    { id: "insert", label: "直接插入", ch: "c9", note: "平均移动 n²/4，基本有序时最好 O(n)。", cx: "时间 O(n²) · 空间 O(1)" },
    { id: "shell", label: "希尔排序", ch: "c9", note: "分组插入，增量递减，不稳定。", cx: "时间 O(n^1.3) · 空间 O(1)" },
    { id: "bubble", label: "冒泡排序", ch: "c9", note: "相邻交换，一趟没换就可以停。", cx: "时间 O(n²) · 空间 O(1)" },
    { id: "quick", label: "快速排序", ch: "c9", note: "一趟划分把基准送到最终位置，平均 O(nlogn)。", hot: true, cx: "平均 O(nlog n) · 最坏 O(n²) · 空间 O(log n)" },
    { id: "select", label: "简单选择", ch: "c9", note: "每趟选最小，比较次数固定 n(n-1)/2。", cx: "时间 O(n²) · 空间 O(1)" },
    { id: "heap", label: "堆排序", ch: "c9", note: "建堆 O(n)，每次调整 O(logn)，不稳定。", cx: "时间 O(nlog n) · 空间 O(1)" },
    { id: "merge", label: "归并排序", ch: "c9", note: "两两归并，稳定，需要 O(n) 辅助空间。", cx: "时间 O(nlog n) · 空间 O(n)" },
    { id: "radix", label: "基数排序", ch: "c9", note: "按位分配收集，不比较关键字，稳定。", cx: "时间 O(d(n+r)) · 空间 O(n+r)" },
    { id: "external", label: "外排序", ch: "c9", note: "内存放不下时的多路归并，配败者树。", cx: "时间 O(nlog n)" },
    { id: "stable", label: "稳定性", ch: "c9", note: "快排、希尔、选择、堆排不稳定，其余稳定。", cx: "—" }
  ],
  edges: [
    ["adt", "list", "part"], ["adt", "complexity", "part"], ["complexity", "bigo", "part"],
    ["complexity", "space", "contrast"], ["array", "glist", "part"],
    ["list", "seqlist", "part"], ["list", "linklist", "part"],
    ["list", "dlink", "part"], ["list", "clink", "part"], ["list", "staticlist", "part"],
    ["seqlist", "insertdel", "part"], ["linklist", "reverse", "part"],
    ["seqlist", "linklist", "contrast"], ["clink", "cqueue", "confuse"],

    ["stack", "brackets", "apply"], ["stack", "infix2post", "apply"], ["stack", "recursion", "apply"],
    ["queue", "cqueue", "part"], ["stack", "queue", "contrast"], ["recursion", "dfs", "prereq"],

    ["string", "naive", "part"], ["string", "kmp", "part"], ["kmp", "nextarr", "part"],
    ["naive", "kmp", "contrast"],

    ["array", "compress", "apply"], ["array", "sparse", "apply"],

    ["btree", "btreeprop", "part"], ["btree", "fulltree", "part"], ["btree", "traversal", "part"],
    ["btree", "levelorder", "part"], ["btree", "thread", "part"], ["btree", "forest", "part"],
    ["traversal", "reconstruct", "prereq"], ["traversal", "levelorder", "contrast"],
    ["btree", "huffman", "apply"], ["huffman", "huffcode", "apply"],
    ["btreeprop", "fulltree", "prereq"], ["fulltree", "heap", "apply"], ["unionfind", "kruskal", "apply"],

    ["graph", "adjmatrix", "part"], ["graph", "adjlist", "part"], ["graph", "dfs", "part"],
    ["graph", "bfs", "part"], ["graph", "mst", "part"], ["graph", "dijkstra", "part"],
    ["graph", "floyd", "part"], ["graph", "topo", "part"],
    ["mst", "prim", "part"], ["mst", "kruskal", "part"], ["prim", "kruskal", "contrast"],
    ["dfs", "bfs", "contrast"], ["adjmatrix", "adjlist", "contrast"],
    ["dijkstra", "floyd", "contrast"], ["topo", "aoe", "prereq"], ["queue", "bfs", "apply"],

    ["search", "seqsearch", "part"], ["search", "binsearch", "part"], ["search", "blocksearch", "part"],
    ["search", "bst", "part"], ["search", "avl", "part"], ["search", "btreeb", "part"],
    ["search", "hash", "part"], ["hash", "hashprob", "part"], ["hash", "asl", "prereq"],
    ["seqsearch", "binsearch", "contrast"], ["seqlist", "binsearch", "prereq"],
    ["bst", "avl", "prereq"], ["binsearch", "bst", "contrast"], ["hashprob", "asl", "prereq"],

    ["sort", "insert", "part"], ["sort", "shell", "part"], ["sort", "bubble", "part"],
    ["sort", "quick", "part"], ["sort", "select", "part"], ["sort", "heap", "part"],
    ["sort", "merge", "part"], ["sort", "radix", "part"], ["sort", "external", "part"],
    ["insert", "shell", "prereq"], ["quick", "merge", "contrast"], ["heap", "select", "contrast"],
    ["bubble", "quick", "prereq"], ["sort", "stable", "apply"], ["insertdel", "sort", "prereq"]
  ]
};