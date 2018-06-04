highlight_e-gov
===============

[e-Gov法令検索](http://elaws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0100/)で検索できる法令条文の括弧書きを強調表示します。  
※元ネタ：[はけた@m-haketa](https://twitter.com/excelspeedup)氏の[m-haketa/colored_e-gov](https://github.com/m-haketa/colored_e-gov)  


インストール
------------
[Tampermonkey](http://tampermonkey.net/)を入れたブラウザで、  

> [highlight_e-gov.user.js](https://furyutei.github.io/highlight_e-gov/src/js/highlight_e-gov.user.js)  

をクリックしてインストール。  


使い方
------
[e-Gov法令検索](http://elaws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0100/)から条文を検索して表示すると、括弧書き（"（～）" や "「～」"）に色がつきます。  

【例】  

- [消費税法](http://elaws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0500/detail?lawId=363AC0000000108)
- [法人税法](http://elaws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0500/detail?lawId=340AC0000000034)
- [法人税法施行令](http://elaws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0500/detail?lawId=340CO0000000097)
- [租税特別措置法施行令](http://elaws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0500/detail?lawId=332CO0000000043)

動作はかなり重たいのでご注意ください。  
まずは分量の比較的少ない条文からお試しを（上記の例では[消費税法](http://elaws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0500/detail?lawId=363AC0000000108)など）。  


参考
----
- [m-haketa/colored_e-gov: e-govの税法条文に色をつけます](https://github.com/m-haketa/colored_e-gov)


ライセンス
----------
[The MIT License](https://github.com/furyutei/highlight_e-gov/blob/master/LICENSE)  
