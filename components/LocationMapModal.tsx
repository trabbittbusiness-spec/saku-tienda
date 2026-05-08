import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, TextInput, Pressable, Modal, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { MapPin, Search, X, Minus, Plus, Home, Briefcase, Navigation, Dog as DogIcon } from 'lucide-react-native';

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (location: any) => void;
}

export default function LocationMapModal({ isOpen, onClose, onSave }: LocationMapModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;
  const mapRef = React.useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('CASA');
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState({
    main: '',
    sub: '',
    lat: -33.4425,
    lng: -70.6400
  });
  const [instructions, setInstructions] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: -33.4425, lng: -70.6400 });

  const handleMessage = async (e: any) => {
    try {
      if (!e.data) return;
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (data.type === 'map_moved') {
        const { lat, lng } = data;
        
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg&language=es`;
        const fetchUrl = Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(geoUrl)}` : geoUrl;
        const res = await fetch(fetchUrl);
        const geoData = await res.json();
        
        if (geoData.results && geoData.results.length > 0) {
          const result = geoData.results[0];
          const addressParts = result.formatted_address.split(',');
          
          const streetNumber = result.address_components.find((c: any) => c.types.includes('street_number'))?.long_name;
          const route = result.address_components.find((c: any) => c.types.includes('route'))?.long_name;
          
          setSelectedLocation({
            main: (route && streetNumber) ? `${route} ${streetNumber}` : (addressParts[0] || 'Ubicación seleccionada'),
            sub: addressParts.slice(1).map(s => s.trim()).join(', ') || '',
            fullAddress: result.formatted_address,
            lat: lat,
            lng: lng
          });
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const onWebMessage = (e: any) => handleMessage(e);
    window.addEventListener('message', onWebMessage);
    return () => window.removeEventListener('message', onWebMessage);
  }, []);

  const googleMapsHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { padding: 0; margin: 0; background: #E5E7EB; }
            #map { width: 100%; height: 100vh; }
            .gm-style-cc { display: none !important; }
            button[title="Stop centering map"] { display: none !important; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            function initMap() {
                var map = new google.maps.Map(document.getElementById('map'), {
                    center: {lat: ${mapCenter.lat}, lng: ${mapCenter.lng}},
                    zoom: 17,
                    disableDefaultUI: true,
                    styles: [
                        {
                            "featureType": "poi",
                            "elementType": "labels",
                            "stylers": [{ "visibility": "off" }]
                        }
                    ]
                });

                var marker = new google.maps.Marker({
                    position: {lat: ${mapCenter.lat}, lng: ${mapCenter.lng}},
                    map: map,
                    draggable: true,
                    icon: {
                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                        fillColor: '#EF4444',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                        scale: 2,
                        anchor: new google.maps.Point(12, 22)
                    }
                });

                marker.addListener('dragend', function() {
                    var pos = marker.getPosition();
                    var msg = JSON.stringify({ 
                        type: 'map_moved', 
                        lat: pos.lat(), 
                        lng: pos.lng() 
                    });
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(msg);
                    } else {
                        window.parent.postMessage(msg, '*');
                    }
                });

                map.addListener('click', function(e) {
                    var pos = e.latLng;
                    marker.setPosition(pos);
                    var msg = JSON.stringify({ 
                        type: 'map_moved', 
                        lat: pos.lat(), 
                        lng: pos.lng() 
                    });
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(msg);
                    } else {
                        window.parent.postMessage(msg, '*');
                    }
                });

                window.addEventListener('message', function(e) {
                  try {
                    var data = JSON.parse(e.data);
                    if (data.type === 'set_center') {
                      var pos = {lat: data.lat, lng: data.lng};
                      map.setCenter(pos);
                      map.setZoom(17);
                      marker.setPosition(pos);
                      
                      var msg = JSON.stringify({ 
                        type: 'map_moved', 
                        lat: pos.lat, 
                        lng: pos.lng 
                      });
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(msg);
                      } else {
                        window.parent.postMessage(msg, '*');
                      }
                    }
                    if (data.type === 'zoom_in') {
                      map.setZoom(map.getZoom() + 1);
                    }
                    if (data.type === 'zoom_out') {
                      map.setZoom(map.getZoom() - 1);
                    }
                  } catch(err) {}
                });
            }
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg&callback=initMap&language=es" async defer></script>
    </body>
    </html>
  `;

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}>
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
            <View style={{
        width: isDesktop ? 1000 : '100%', 
        height: isDesktop ? 520 : '100%', 
        backgroundColor: '#FFFFFF', 
        borderRadius: isDesktop ? 48 : 0,
        flexDirection: isDesktop ? 'row' : 'column', 
        padding: isDesktop ? 12 : 0,
        shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.2, shadowRadius: 60,
        borderWidth: isDesktop ? 1 : 0, borderColor: '#F3F4F6',
        position: 'relative'
      }}>
        
        {/* MAP SECTION - FULL SCREEN BACKGROUND ON MOBILE */}
        <View style={{ 
          width: isDesktop ? 496 : '100%', 
          height: isDesktop ? 496 : '100%', 
          borderRadius: isDesktop ? 40 : 0, 
          overflow: 'hidden', 
          position: isDesktop ? 'relative' : 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#F3F4F6'
        }}>
          {Platform.OS === 'web' ? (
            <iframe
              ref={mapRef}
              srcDoc={googleMapsHtml}
              style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 } as any}
              allowFullScreen={false}
              loading="lazy"
              title="Interactive Map"
            />
          ) : (
            <WebView
              ref={mapRef}
              originWhitelist={['*']}
              source={{ html: googleMapsHtml }}
              onMessage={(event) => handleMessage(event.nativeEvent)}
              style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
              }}
            />
          )}

          {/* Zoom Controls (Floating over Map) */}
          <View style={{ 
            position: 'absolute' as any, 
            top: isDesktop ? undefined : insets.top + 80,
            bottom: isDesktop ? 92 : undefined, 
            right: 16, 
            gap: 12, alignItems: 'center',
            zIndex: 9999 
          }}>
            <TouchableOpacity 
              onPress={() => {
                const msg = JSON.stringify({ type: 'zoom_in' });
                if (Platform.OS === 'web') mapRef.current?.contentWindow.postMessage(msg, '*');
                else mapRef.current?.injectJavaScript(`window.postMessage(${JSON.stringify(msg)}, '*')`);
              }}
              style={{
                width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF',
                justifyContent: 'center', alignItems: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8
              }}
            >
              <Plus size={24} color="#1F2937" strokeWidth={3} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                const msg = JSON.stringify({ type: 'zoom_out' });
                if (Platform.OS === 'web') mapRef.current?.contentWindow.postMessage(msg, '*');
                else mapRef.current?.injectJavaScript(`window.postMessage(${JSON.stringify(msg)}, '*')`);
              }}
              style={{
                width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF',
                justifyContent: 'center', alignItems: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8
              }}
            >
              <Minus size={24} color="#1F2937" strokeWidth={3} />
            </TouchableOpacity>
          </View>

          {/* GPS Button (Floating over Map) */}
          <TouchableOpacity 
            onPress={async () => {
              if (Platform.OS === 'web') {
                if (typeof navigator !== 'undefined' && navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      const msg = JSON.stringify({ type: 'set_center', lat: latitude, lng: longitude });
                      if (mapRef.current) {
                        const win = mapRef.current.contentWindow || mapRef.current;
                        win.postMessage(msg, '*');
                      }
                    },
                    (error) => console.log('Geolocation error:', error),
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                  );
                }
              } else {
                try {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para centrar el mapa.');
                    return;
                  }

                  const location = await Location.getCurrentPositionAsync({});
                  const { latitude, longitude } = location.coords;
                  const msg = JSON.stringify({ type: 'set_center', lat: latitude, lng: longitude });
                  
                  if (mapRef.current) {
                    mapRef.current.injectJavaScript(`window.postMessage(${JSON.stringify(msg)}, '*')`);
                  }
                } catch (error) {
                  console.log('Native Geolocation error:', error);
                }
              }
            }}
            style={{
              position: 'absolute' as any, 
              top: isDesktop ? undefined : insets.top + 210,
              bottom: isDesktop ? 20 : undefined, 
              right: 16,
              width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF',
              justifyContent: 'center', alignItems: 'center',
              shadowColor: '#63348C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
              zIndex: 9999
            }}
          >
            <Navigation size={26} color="#63348C" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* FLOATING SEARCH BAR (MOBILE) */}
        {!isDesktop && (
          <View style={{ 
            position: 'absolute', top: insets.top + 10, left: 15, right: 15, 
            zIndex: 1000 
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
              borderRadius: 20, paddingHorizontal: 16, height: 56,
              shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
              borderWidth: 1, borderColor: '#F3F4F6'
            }}>
              <TouchableOpacity onPress={onClose} style={{ marginRight: 10 }}>
                <X size={20} color="#111827" />
              </TouchableOpacity>
              <TextInput
                placeholder="¿A dónde enviamos?"
                placeholderTextColor="#9CA3AF"
                value={mapSearchQuery}
                onChangeText={async (text) => {
                  setMapSearchQuery(text);
                  setShowAutocomplete(text.length > 0);
                  if (text.length > 2) {
                    try {
                      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg&language=es`;
                      const fetchUrl = Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url;
                      const res = await fetch(fetchUrl);
                      const data = await res.json();
                      if (data.predictions) setSearchResults(data.predictions);
                    } catch (e) { console.log('Search error:', e); }
                  } else { setSearchResults([]); }
                }}
                onFocus={() => setShowAutocomplete(mapSearchQuery.length > 0)}
                style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }}
              />
              {mapSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setMapSearchQuery(''); setShowAutocomplete(false); }}>
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Mobile Autocomplete Results */}
            {showAutocomplete && (
              <View style={{
                backgroundColor: '#FFFFFF', borderRadius: 20, marginTop: 10,
                shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, elevation: 20,
                maxHeight: 300, overflow: 'hidden'
              }}>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {searchResults.map((place, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={async () => {
                        setMapSearchQuery(place.description);
                        setShowAutocomplete(false);
                        try {
                          const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place.description)}&key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg&language=es`;
                          const fetchUrl = Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(geoUrl)}` : geoUrl;
                          const res = await fetch(fetchUrl);
                          const data = await res.json();
                          if (data.results?.[0]) {
                            const { lat, lng } = data.results[0].geometry.location;
                            const msg = JSON.stringify({ type: 'set_center', lat, lng });
                            if (Platform.OS === 'web') {
                              mapRef.current?.contentWindow.postMessage(msg, '*');
                            } else {
                              mapRef.current?.postMessage(msg);
                            }
                            setSelectedLocation({
                              main: place.structured_formatting?.main_text || place.description,
                              sub: place.structured_formatting?.secondary_text || '',
                              fullAddress: data.results[0].formatted_address,
                              lat, lng
                            });
                          }
                        } catch (e) { console.log('Geocode error:', e); }
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                    >
                      <MapPin size={18} color="#9CA3AF" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{place.structured_formatting?.main_text || place.description}</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }} numberOfLines={1}>{place.structured_formatting?.secondary_text}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* INFO CARD / BOTTOM SHEET (MOBILE) */}
        <View style={{ 
          flex: isDesktop ? 1 : undefined,
          paddingHorizontal: isDesktop ? 40 : 20, 
          paddingVertical: isDesktop ? 20 : 25,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: isDesktop ? 0 : 32,
          borderTopRightRadius: isDesktop ? 0 : 32,
          position: isDesktop ? 'relative' : 'absolute',
          bottom: 0, left: 0, right: 0,
          shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 15,
          zIndex: 2000
        }}>
          {isDesktop && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', letterSpacing: 2, textTransform: 'uppercase' }}>Fijar Destino</Text>
              <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          {isDesktop && (
            <View style={{ position: 'relative', zIndex: 100, marginBottom: 24 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
                borderRadius: 20, paddingHorizontal: 16, height: 64, borderWidth: 1, borderColor: '#E5E7EB',
              }}>
                <Search size={20} color="#9CA3AF" strokeWidth={2} />
                <TextInput
                  placeholder="Busca una dirección..."
                  placeholderTextColor="#9CA3AF"
                  value={mapSearchQuery}
                  onChangeText={async (text) => {
                    setMapSearchQuery(text);
                    setShowAutocomplete(text.length > 0);
                    if (text.length > 2) {
                      try {
                        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg&language=es`;
                        const fetchUrl = Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url;
                        const res = await fetch(fetchUrl);
                        const data = await res.json();
                        if (data.predictions) setSearchResults(data.predictions);
                      } catch (e) { console.log('Search error:', e); }
                    } else { setSearchResults([]); }
                  }}
                  style={{ flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#111827' }}
                />
              </View>
              {showAutocomplete && (
                <View style={{ position: 'absolute', top: 72, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 40, elevation: 50, borderWidth: 1, borderColor: '#E5E7EB', maxHeight: 300, zIndex: 1000 }}>
                  <ScrollView>
                    {searchResults.map((place, idx) => (
                      <TouchableOpacity key={idx} onPress={async () => {
                        setMapSearchQuery(place.description);
                        setShowAutocomplete(false);
                        try {
                          const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place.description)}&key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg&language=es`;
                          const fetchUrl = Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(geoUrl)}` : geoUrl;
                          const res = await fetch(fetchUrl);
                          const data = await res.json();
                          if (data.results?.[0]) {
                            const { lat, lng } = data.results[0].geometry.location;
                            if (mapRef.current) {
                              const msg = JSON.stringify({ type: 'set_center', lat, lng });
                              if (Platform.OS === 'web') mapRef.current.contentWindow.postMessage(msg, '*');
                              else mapRef.current.postMessage(msg);
                            }
                            setSelectedLocation({
                              main: place.structured_formatting?.main_text || place.description,
                              sub: place.structured_formatting?.secondary_text || '',
                              fullAddress: data.results[0].formatted_address,
                              lat, lng
                            });
                          }
                        } catch (e) { console.log('Geocode error:', e); }
                      }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                        <MapPin size={16} color="#6B7280" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{place.structured_formatting?.main_text || place.description}</Text>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>{place.structured_formatting?.secondary_text}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <View style={{ marginBottom: 25 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 15 }}>
              <View style={{ width: 4, height: 36, backgroundColor: '#63348C', borderRadius: 4 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: isDesktop ? 24 : 18, fontWeight: '900', color: '#111827' }} numberOfLines={1}>{selectedLocation.main || '¿Dónde estás?'}</Text>
                <Text style={{ fontSize: isDesktop ? 14 : 12, color: '#9CA3AF', fontWeight: '700' }} numberOfLines={1}>{selectedLocation.sub || 'Fija un punto en el mapa'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
              {[ { label: 'CASA', icon: Home }, { label: 'TRABAJO', icon: Briefcase }, { label: 'VET', icon: DogIcon } ].map((cat) => (
                <Pressable key={cat.label} onPress={() => setSelectedCategory(cat.label)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12, borderRadius: 16, backgroundColor: selectedCategory === cat.label ? '#FFF7ED' : '#F9FAFB', borderWidth: 1.5, borderColor: selectedCategory === cat.label ? '#63348C' : '#F3F4F6' }}>
                  <cat.icon size={18} color={selectedCategory === cat.label ? '#63348C' : '#9CA3AF'} strokeWidth={2.5} />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: selectedCategory === cat.label ? '#63348C' : '#6B7280' }}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ 
              backgroundColor: '#F9FAFB', 
              borderRadius: 16, 
              borderWidth: 1, 
              borderColor: '#E5E7EB',
              paddingHorizontal: 16,
              paddingVertical: Platform.OS === 'ios' ? 14 : 4,
            }}>
              <TextInput
                placeholder="Instrucciones (ej. Depto 12, Condominio, etc.)"
                placeholderTextColor="#9CA3AF"
                value={instructions}
                onChangeText={setInstructions}
                style={{ fontSize: 14, fontWeight: '500', color: '#111827', minHeight: 40 }}
              />
            </View>
          </View>

          {(() => {
            const canConfirm = !!selectedLocation.main && instructions.trim().length > 0;
            return (
              <TouchableOpacity
                onPress={() => { if (!canConfirm) return; if (onSave) onSave({ ...selectedLocation, category: selectedCategory, instructions }); onClose(); }}
                disabled={!canConfirm}
                style={{ backgroundColor: canConfirm ? '#63348C' : '#D1D5DB', borderRadius: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#63348C', shadowOpacity: canConfirm ? 0.3 : 0, shadowRadius: 15, elevation: canConfirm ? 10 : 0 }}>
                <MapPin size={20} color="#FFFFFF" strokeWidth={3} />
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 }}>CONFIRMAR UBICACIÓN</Text>
              </TouchableOpacity>
            );
          })()}
        </View>
      </View>
    </View>
  </Modal>
);
}
