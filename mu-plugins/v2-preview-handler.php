<?php
/**
 * Plugin Name: V2/V3/V4 Preview Slug Handler
 * Description: Serves preview pages under -v2, -v3, -v4 slugs for board review.
 *              RAM-69: v2 slugs → original Elementor pages.
 *              RAM-73: v3 slugs → redesigned Elementor pages.
 *              RAM-73 v4: v4 slugs → static HTML files (outside WordPress).
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

    // v3 slugs → redesigned Elementor pages (RAM-73)
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

    $path = trim( parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ), '/' );

    // v4 slugs → static HTML files served directly (fora do WordPress, RAM-73 v4)
    $map_v4 = [
        'links-v4'                         => 'links-v4.html',
        'presets-v4'                       => 'presets-v4.html',
        'guia-iluminacao-v4'               => 'guia-iluminacao-v4.html',
        'guia-fotografia-corporativa-v4'   => 'guia-fotografia-corporativa-v4.html',
        'wsp-2026-v4'                      => 'wsp-2026-v4.html',
        'ws-photoshop-v4'                  => 'ws-photoshop-v4.html',
        'curso-fotografia-celular-v4'      => 'curso-fotografia-celular-v4.html',
        'verso-e-reverso-v4'               => 'verso-e-reverso-v4.html',
        'guia-v4'                          => 'guia-v4.html',
    ];

    // Handle v4 — serve static HTML directly, bypassing WordPress rendering
    if ( isset( $map_v4[ $path ] ) ) {
        $static_dir = ABSPATH . 'pages/';
        $file       = $static_dir . $map_v4[ $path ];

        if ( ! file_exists( $file ) ) {
            // File not deployed yet — return 503
            header( 'HTTP/1.1 503 Service Unavailable' );
            header( 'X-Robots-Tag: noindex, nofollow', true );
            echo '<h1>503 — v4 page not deployed yet</h1>';
            exit;
        }

        header( 'Content-Type: text/html; charset=UTF-8' );
        header( 'X-Robots-Tag: noindex, nofollow', true );
        header( 'Cache-Control: no-store' );
        readfile( $file );
        exit;
    }

    $map = array_merge( $map_v2, $map_v3 );

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
