/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {
  FunctionComponent,
  useEffect,
  useCallback,
  useState,
} from 'react';

import {SafeAreaView, View, Button, ViewProps, StatusBar} from 'react-native';

import {EngineView, useEngine} from '@babylonjs/react-native';
import {SceneLoader} from '@babylonjs/core/Loading/sceneLoader';
import {Camera} from '@babylonjs/core/Cameras/camera';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/loaders/glTF';
import {Scene} from '@babylonjs/core/scene';
import {WebXRSessionManager, WebXRTrackingState, WebXRFeatureName, WebXRPlaneDetector} from '@babylonjs/core/XR';
import {
  FreeCamera,
  HemisphericLight,
  Mesh, 
  MeshBuilder, 
  TubeBuilder,
  TransformNode,
  Vector3,
  Quaternion
} from '@babylonjs/core';
import * as Earcut from 'earcut';

const EngineScreen: FunctionComponent<ViewProps> = (props: ViewProps) => {
  const engine = useEngine();
  const [camera, setCamera] = useState<Camera>();
  const [xrSession, setXrSession] = useState<WebXRSessionManager>();
  const [trackingState, setTrackingState] = useState<WebXRTrackingState>();
  const [scene, setScene] = useState<Scene>();
  const [planeMat, setPlaneMat] = useState<any>();


  const onToggleXr = useCallback(() => {
    (async () => {
      if (xrSession) {
        await xrSession.exitXRAsync();
      } else {
        if (scene !== undefined) {
          const xr = await scene.createDefaultXRExperienceAsync({
            disableDefaultUI: true,
            disableTeleportation: true,
          });

          // Do some plane shtuff.
          const xrPlanes = xr.baseExperience.featuresManager.enableFeature(
            WebXRFeatureName.PLANE_DETECTION,
            "latest"
          ) as WebXRPlaneDetector;
          console.log("Enabled plane detection.");
          const planes: any[] = [];

          xrPlanes.onPlaneAddedObservable.add((webXRPlane) => {
            if (scene) {
              console.log("Plane added.");
              let plane: any = webXRPlane;
              webXRPlane.polygonDefinition.push(
                webXRPlane.polygonDefinition[0]
              );
              try {
                plane.mesh = MeshBuilder.CreatePolygon(
                  "plane",
                  { shape: plane.polygonDefinition },
                  scene,
                  Earcut
                );
                let tubeMesh: Mesh = TubeBuilder.CreateTube(
                  "tube",
                  {
                    path: plane.polygonDefinition,
                    radius: 0.005,
                    sideOrientation: Mesh.FRONTSIDE,
                    updatable: true,
                  },
                  scene
                );
                tubeMesh.setParent(plane.mesh);
                planes[plane.id] = plane.mesh;
                plane.mesh.material = planeMat;

                plane.mesh.rotationQuaternion = new Quaternion();
                plane.transformationMatrix.decompose(
                  plane.mesh.scaling,
                  plane.mesh.rotationQuaternion,
                  plane.mesh.position
                );
              } catch (ex) {
                console.error(ex);
              }
            }
          });

          const session = await xr.baseExperience.enterXRAsync(
            'immersive-ar',
            'unbounded',
            xr.renderTarget,
          );
          setXrSession(session);
          session.onXRSessionEnded.add(() => {
            setXrSession(undefined);
            setTrackingState(undefined);
          });

          setTrackingState(xr.baseExperience.camera.trackingState);
          xr.baseExperience.camera.onTrackingStateChanged.add(
            newTrackingState => {
              setTrackingState(newTrackingState);
            },
          );
        }
      }
    })();
  }, [scene, xrSession]);

  useEffect(() => {
    if (engine) {
      const url =
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf';
      SceneLoader.LoadAsync(url, undefined, engine).then(loadScene => {
        setScene(loadScene);
        loadScene.createDefaultCameraOrLight(true, undefined, true);
        (loadScene.activeCamera as ArcRotateCamera).alpha += Math.PI;
        (loadScene.activeCamera as ArcRotateCamera).radius = 10;
        setCamera(loadScene.activeCamera!);
      });
    }
  }, [engine]);

  return (
    <>
      <View style={props.style}>
        <Button
          title={xrSession ? 'Stop XR' : 'Start XR'}
          onPress={onToggleXr}
        />
        <View style={{flex: 1}}>
          <EngineView camera={camera} displayFrameRate={true} />
        </View>
      </View>
    </>
  );
};

const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
        <EngineScreen style={{flex: 1}} />
      </SafeAreaView>
    </>
  );
};

export default App;
