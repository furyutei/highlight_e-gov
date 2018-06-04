// ==UserScript==
// @name            highlight_e-gov
// @namespace       https://furyu.hatenablog.com/
// @version         0.0.1.1
// @description     e-gov 法令条文の括弧書きを強調
// @author          furyu
// @match           *://elaws.e-gov.go.jp/search/*
// @require         https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// ==/UserScript==

/*
Required
--------
- [jQuery](https://jquery.com/)
    The MIT License
    [License | jQuery Foundation](https://jquery.org/license/)

References
----------
- [m-haketa/colored_e-gov: e-govの税法条文に色をつけます](https://github.com/m-haketa/colored_e-gov)  
    Copyright (c) 2018 m-haketa  
    [The MIT Licence](https://github.com/m-haketa/colored_e-gov/blob/master/LICENSE)  
*/

/*
The MIT License (MIT)

Copyright (c) 2018 furyu <furyutei@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


( () => {
'use strict';

var SCRIPT_NAME = 'highlight_e-gov',
    DEBUG = false,
    
    $ = jQuery,
    
    IS_TOUCHED = ( () => {
        var touched_id = SCRIPT_NAME + '_touched',
            $touched = $( '#' + touched_id );
        
        if ( 0 < $touched.length ) {
            return true;
        }
        
        $( '<b>' ).attr( 'id', touched_id ).css( 'display', 'none' ).appendTo( $( document.documentElement ) );
        
        return false;
    } )();

if ( ( window !== window.top ) || IS_TOUCHED ) {
    return;
}

if ( typeof console.log.apply == 'undefined' ) {
    [ 'log', 'info', 'warn', 'error', 'assert', 'dir', 'clear', 'profile', 'profileEnd' ].forEach( function ( method ) {
        console[ method ] = this.bind( console[ method ], console );
    }, Function.prototype.call );
    
    console.log( 'note: console.log.apply is undefined => patched' );
}

var DEFAULT_HIGHLIGHT_BRACKETS_OPTIONS = {
        leftBrackets : '「（', // 対象開括弧(文字列: '「（' もしくは文字列の配列: ['「','（'] )
        rightBrackets : '」）', // 対象閉括弧(同上)
        // ※ leftBrackets と rightBrackets は 1:1 に対応させておくこと(文字列もしくは配列のインデックスが同じものをペアとみなす)
        
        levelColors : [ '#CC0000', '#999900', '#009999', '#2020A0', '#CC00CC' ], // 括弧書きの強調色をカラーコードで列挙(ネストレベルに応じて強調色を切替)
        
        styleId : 'highlight-brackets-style', // CSS設定用style要素のid
        tagName : 'span', // 強調(wrap)用要素タグ名
        className : 'highlight-brackets', // 強調用要素の共通クラス名
        classLevelPrefix : 'highlight-brackets-level-', // 強調用要素のレベル指定用クラス名の接頭辞
        
        strictMode : false, // true: テキストノードのみ置換(動作が重い) / false: HTMLタグも含めて置換(HTMLを壊す恐れあり・動作は軽い)
        asyncRewrite : true, // true: HTML書換を非同期に実施
        excludeNodes :  ['style', 'script', 'textarea', 'iframe', 'frame'] // 対象外とするノード(strictMode: true時のみ有効)
    },
    
    to_array = ( array_like_object ) => Array.from( array_like_object ),
    
    log_debug = function () {
        if ( ! DEBUG ) {
            return;
        }
        var arg_list = [ '[' + SCRIPT_NAME + ']', '(' + ( new Date().toISOString() ) + ')' ];
        console.log.apply( console, arg_list.concat( to_array( arguments ) ) );
    },
    
    log_info = function () {
        var arg_list = [ '[' + SCRIPT_NAME + ']', '(' + ( new Date().toISOString() ) + ')' ];
        console.info.apply( console, arg_list.concat( to_array( arguments ) ) );
    },
    
    log_error = function () {
        var arg_list = [ '[' + SCRIPT_NAME + ']', '(' + ( new Date().toISOString() ) + ')' ];
        console.error.apply( console, arg_list.concat( to_array( arguments ) ) );
    };


$.extend( {
    setHighlightBracketsColors : function ( levelColors, options ) {
        options = $.extend( {}, DEFAULT_HIGHLIGHT_BRACKETS_OPTIONS, options );
        
        if ( levelColors ) {
            options.levelColors = levelColors;
        }
        
        var styleId = options.styleId,
            css_text = options.levelColors.map( ( levelColor, index ) => options.tagName + '.' + options.classLevelPrefix + index + '{color:' + levelColor + ';}' ).join( '\n' );
        
        $( 'style#' + styleId ).remove();
        $( '<style type="text/css" />' ).attr( 'id', styleId ).text( css_text ).appendTo( $( document.querySelector( 'head' ) || document.body || document.documentElement ) );
    } // end of setHighlightBracketsColors()
} );


$.fn.highlight_brackets = ( () => {
    var is_string = ( target ) => ( Object.prototype.toString.call( target ) == '[object String]' ),
        
        escape_string_for_regexp = ( () => {
            var reg_target = /[.*+?^$|,(){}[\]\-\/\\\s]/g;
            
            return ( string ) => string.replace( reg_target, '\\$&' );
        } )(),
        
        $work = $( '<div/>' );
    
    return function ( options ) {
        options = $.extend( {}, DEFAULT_HIGHLIGHT_BRACKETS_OPTIONS, options );
        
        var $self = this,
            
            $target_nodes,
            total_number = 0,
            remain_number = 0,
            
            leftBrackets = is_string( options.leftBrackets ) ? options.leftBrackets.split( '' ) : options.leftBrackets,
            rightBrackets = is_string( options.rightBrackets ) ? options.rightBrackets.split( '' ) : options.rightBrackets,
            escaped_leftBrackets = leftBrackets.map( ( leftBracket ) => escape_string_for_regexp( leftBracket ) ),
            escaped_rightBrackets = rightBrackets.map( ( rightBracket ) => escape_string_for_regexp( rightBracket ) ),
            reg_brackets = new RegExp( '(' + escaped_leftBrackets.join( '|' ) + '|' + escaped_rightBrackets.join( '|' ) + ')' ),
            
            exclude_node_map = {},
            excludeNodes = options.excludeNodes.map( ( excludeNode ) => {
                exclude_node_map[ excludeNode.toLowerCase() ] = true;
                return excludeNode;
            } ),
            
            highlight_tag_name = options.tagName.toLowerCase(),
            highlight_class = options.className,
            highlight_class_level_prefix = options.classLevelPrefix,
            
            get_open_tag = ( level ) => '<' + highlight_tag_name + ' class="' + highlight_class_level_prefix + ( level ? level : '0' ) + '">',
            get_close_tag = () => '</' + highlight_tag_name + '>',
            
            get_highlight_html = ( source_text ) => {
                var bracket_stack = [],
                    text_stack = [],
                    html_stack = [],
                    
                    push_text = ( text_fragment ) => {
                        text_stack.push( text_fragment );
                    },
                    
                    check_bracket = ( bracket ) => {
                        var bracket_level = bracket_stack.length - 1,
                            expected_bracket = bracket_stack[ bracket_level ];
                        
                        if ( bracket == expected_bracket ) {
                            push_text( bracket );
                            push_text( get_close_tag() );
                            html_stack.push( text_stack.join( '' ) );
                            text_stack = [];
                            bracket_stack.pop();
                            return;
                        }
                        
                        var bracket_index = leftBrackets.indexOf( bracket );
                        
                        if ( 0 <= bracket_index ) {
                            push_text( get_open_tag( bracket_level + 1 ) );
                            push_text( bracket );
                            html_stack.push( text_stack.join( '' ) );
                            text_stack = [];
                            bracket_stack.push( rightBrackets[ bracket_index ] );
                            return;
                        }
                        
                        var exist_bracket_index = bracket_stack.lastIndexOf( bracket );
                        
                        if ( exist_bracket_index < 0 ) {
                            text_stack.unshift( get_open_tag( bracket_level + 1 ) );
                            bracket_stack.push( bracket );
                            check_bracket( bracket );
                            return;
                        }
                        
                        bracket_stack.slice( exist_bracket_index + 1 ).map( () => push_text( get_close_tag() ) );
                        html_stack.push( text_stack.join( '' ) );
                        text_stack = [];
                        bracket_stack = bracket_stack.slice( 0, exist_bracket_index + 1 );
                        check_bracket( bracket );
                    },
                    
                    text_fragment_functions = [ push_text, check_bracket ];
                
                source_text.split( reg_brackets ).map( ( text_fragment, index ) => {
                    text_fragment_functions[ index % 2 ]( text_fragment );
                } );
                
                bracket_stack.map( ( expected_bracket ) => push_text( get_close_tag() ) );
                html_stack.push( text_stack.join( '' ) );
                
                return html_stack.join( '' );
            },
            
            log_remain = ( index ) => {
                log_debug( 'index:', index, 'done. (remain: ', (-- remain_number), '/', total_number, ')' );
                
                if ( remain_number <= 0 ) {
                    log_info( 'all done.' );
                }
            };
        
        if ( options.strictMode ) {
            $target_nodes = $self.find( '*' ).addBack().not( excludeNodes.join( ',' ) ).contents()
                .filter( function() {
                    if ( this.nodeType != 3 ) {
                        return false;
                    }
                    
                    var $parent = $( this ).parent(),
                        parent = $parent.get( 0 ),
                        parent_node_name = parent.nodeName.toLowerCase();
                    
                    if ( exclude_node_map[ parent_node_name ] ) {
                        return false;
                    }
                    
                    if ( ( $parent.hasClass( highlight_class ) ) && ( parent_node_name == highlight_tag_name ) ) {
                        return false;
                    }
                    
                    return true;
                } )
                .each( function ( index ) {
                    var $text_node = $( this ),
                        rewrite = () => {
                            $text_node.before( $work.html( get_highlight_html( $text_node.text() ) ).contents() );
                            $text_node.remove();
                            log_remain( index );
                        };
                    
                    if ( options.asyncRewrite ) {
                        setTimeout( rewrite, 1 );
                    }
                    else {
                        rewrite();
                    }
                } );
        }
        else {
            $target_nodes = $self.each( function ( index ) {
                var $node = $( this ),
                    rewrite = () => {
                        $node.html( get_highlight_html( $node.html() ) );
                        log_remain( index );
                    };
                
                if ( options.asyncRewrite ) {
                    setTimeout( rewrite, 1 );
                }
                else {
                    rewrite();
                }
            } );
        }
        
        total_number = remain_number = $target_nodes.length;
        
        return $self;
    };
} )(); // end of highlight_brackets()


function main() {
    $.setHighlightBracketsColors();
    
    var start = new Date().getTime(); log_info( 'start' );
    
    $( [
        'div.ParagraphSentence',
        'div.ItemSentence',
        'div.ItemSentence2',
        'div.Subitem1Sentence',
        'div.Subitem1Sentence2',
        'div.Subitem2Sentence',
        'div.Subitem2Sentence2',
        'div.Subitem3Sentence',
        'div.Subitem3Sentence2',
        //'div.TableStruct td',
        // TODO: 'div.TableStruct td' の場合、td 下に div がある場合でかつ閉括弧から始まるケース（例：<td class="..."><div class="Sentence">源泉徴収）の</div></td>)等で、spanがdivの外に出てしまう
        //       ※ strictMode : true ならば発生しないが、処理が重くなり、実用に耐えない
        // → 'div.TableStruct td div' に変更して暫定対応
        'div.TableStruct td div',
    ].join( ',' ) ).highlight_brackets( {
        // ※オプション値を指定可能(DEFAULT_HIGHLIGHT_BRACKETS_OPTIONSの同名要素を上書き)
        //  leftBrackets : '「（',
        //  rightBrackets : '」）',
        //  levelColors : [ '#CC0000', '#999900', '#009999', '#2020A0', '#CC00CC' ]
    } );
    
    var end = new Date().getTime(); log_info( 'end - elapsed:', end - start, 'ms' );
    
} // end of main()


main();

} )();
