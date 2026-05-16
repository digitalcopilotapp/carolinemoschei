<?php
/**
 * Plugin Name: V2/V3 Preview Slug Handler
 * Description: Serves Elementor pages under -v2 and -v3 slugs for board review.
 *              RAM-69: v2 slugs route to original Elementor pages.
 *              RAM-73: v3 slugs route to redesigned pages.
 *              Prevents WordPress canonical redirect so preview URLs stay in browser.
 */

add_action('parse_request', function( WP $wp ) {
    // v2 slugs → original published Elementor pages (RAM-69)
    $map_v2 = [
        'links-v2'                          => 7718,
        'presets-v2'                        => 1901,
        'wsp-2026-v2'                       => 13015,
        'verso-reverso-v2'                  => 13505,
        'guia-iluminacao-v2'                => 13805,
        'guia-fotografia-corporativa-v2'    => 13648,
        'curso-de-fotografia-de-celular-v2' => 8512,
        'curso-photoshop-v2'                => 8070,
    ];

    // v3 slugs → redesigned pages (RAM-73)
    $map_v3 = [
        'links-v3'                          => 14550,
        'verso-e-reverso-v3'                => 14551,
        'presets-v3'                        => 14552,
        'guia-iluminacao-v3'                => 14553,
        'guia-fotografia-corporativa-v3'    => 14554,
        'curso-fotografia-celular-v3'       => 14555,
        'ws-photoshop-v3'                   => 14556,
        'wsp-2026-v3'                       => 14557,
        'guia-v3'                           => 14558,
    ];

    $map = array_merge( $map_v2, $map_v3 );

    $path = trim( parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ), '/' );

    if ( ! isset( $map[ $path ] ) ) {
        return;
    }

    // Emit noindex header early (LiteSpeed doesn't reliably propagate SetEnvIf).
    header( 'X-Robots-Tag: noindex, nofollow', true );

    // Override the query to serve the target page.
    $wp->query_vars = [
        'page_id'   => $map[ $path ],
        'post_type' => 'page',
    ];

    // Suppress canonical redirect — page stays at the -v2/-v3 URL.
    add_filter( 'redirect_canonical', '__return_false' );
    add_filter( 'wpseo_canonical', '__return_false' );
    add_filter( 'rank_math/frontend/canonical', '__return_false' );
    // Noindex.
    add_filter( 'wpseo_robots', function () { return 'noindex, nofollow'; } );
    add_filter( 'wpseo_metadesc', '__return_false' );
}, 5 );
